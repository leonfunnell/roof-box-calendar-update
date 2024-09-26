const { google } = require('googleapis');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize the Secret Manager client
const secretClient = new SecretManagerServiceClient();

// Retrieve the service account key from Google Secret Manager
async function getServiceAccountKey() {
  const [version] = await secretClient.accessSecretVersion({
    name: process.env.GCP_SERVICE_ACCOUNT_SECRET + "/versions/latest",
  });
  const payload = version.payload.data.toString();
  return JSON.parse(payload);  // Return parsed service account key
}

// Authenticate with Google Calendar API using service account credentials
async function getGoogleCalendarClient() {
  const key = await getServiceAccountKey();

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// Utility function to convert DD/MM/YYYY to YYYY-MM-DD (for all-day events)
function formatDateToGoogleDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`; // Returns YYYY-MM-DD
}

// Utility function to convert DD/MM/YYYY HH:MM:SS to Google Calendar datetime format (YYYY-MM-DDTHH:MM:SSZ)
function formatDateTimeToGoogleDateTime(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(' ');
  const [day, month, year] = datePart.split('/');
  const formattedDate = `${year}-${month}-${day}T${timePart}:00`; // Adds seconds and the 'T' separator
  return new Date(formattedDate).toISOString(); // Returns in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
}

// Main function that handles the webhook request
exports.handler = async (req, res) => {
  try {
    // Validate the webhook source header
    if (req.headers['x-webhook-source'] !== 'roofbox-webhook-router') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse the incoming webhook payload
    const data = req.body;
    const {
      rowId,
      status,
      pickUpDate,
      returnDate,
      collectionAgreed,
      collectionAppointment,
      collectCalendarID,
      returnAgreed,
      returnAppointment,
      returnCalendarID,
      boxCalID,
      car,
      box,
      price,
      contact,
      phone
    } = data;

    // Check for valid status
    const validStatuses = ['Confirmed', 'On Loan', 'Returned', 'Archived', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(200).json({ message: 'Invalid status, routing ended.' });
    }

    // Initialize Google Calendar API client
    const calendar = await getGoogleCalendarClient();

    // Handle the status "Cancelled": delete existing events if they exist
    if (status === 'Cancelled') {
      if (boxCalID) {
        await deleteCalendarEvent(calendar, boxCalID);
      }
      if (collectCalendarID) {
        await deleteCalendarEvent(calendar, collectCalendarID);
      }
      if (returnCalendarID) {
        await deleteCalendarEvent(calendar, returnCalendarID);
      }

      return res.status(200).json({
        rowId,  // Include rowId in the response
        message: 'Booking cancelled, calendar events deleted',
        boxCalID: "",
        collectCalendarID: "",
        returnCalendarID: ""
      });
    }

    // Convert dates from AppSheet to Google Calendar format
    const googlePickUpDate = formatDateToGoogleDate(pickUpDate);  // YYYY-MM-DD format for all-day events
    const googleReturnDate = formatDateToGoogleDate(returnDate);  // YYYY-MM-DD format for all-day events
    const googleCollectionAppointment = formatDateTimeToGoogleDateTime(collectionAppointment); // ISO format for appointments
    const googleReturnAppointment = formatDateTimeToGoogleDateTime(returnAppointment);         // ISO format for appointments

    // Create or update the Box event if boxCalID is missing
    if (!boxCalID) {
      const newBoxCalID = await createOrUpdateCalendarEvent(calendar, null, car, box, status, googlePickUpDate, googleReturnDate, price, contact, phone);
      boxCalID = newBoxCalID;
    }

    // Create or update the Collection event if agreed
    if (collectionAgreed === 'Y') {
      const newCollectCalendarID = await createOrUpdateCalendarEvent(calendar, collectCalendarID, `Collection Appointment - ${car} - ${box}`, status, googleCollectionAppointment, googleCollectionAppointment, price, contact, phone, 30);
      collectCalendarID = newCollectCalendarID;
    }

    // Create or update the Return event if agreed
    if (returnAgreed === 'Y') {
      const newReturnCalendarID = await createOrUpdateCalendarEvent(calendar, returnCalendarID, `Return Appointment - ${car} - ${box}`, status, googleReturnAppointment, googleReturnAppointment, price, contact, phone, 30);
      returnCalendarID = newReturnCalendarID;
    }

    // Return updated calendar IDs and rowId for AppSheet
    return res.status(200).json({
      rowId,  // Include rowId in the response
      boxCalID,
      collectCalendarID,
      returnCalendarID
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    return res.status(500).json({ message: 'Error processing booking', error });
  }
};

// Function to create or update a Google Calendar event
async function createOrUpdateCalendarEvent(calendar, eventId, summary, status, startDateTime, endDateTime, price, contact, phone, durationMinutes = null) {
  const eventBody = {
    summary: summary,
    description: `Status: ${status}\nPrice: ${price}\nContact: ${contact}\nPhone: ${phone}`,
    start: { dateTime: startDateTime },
    end: { dateTime: durationMinutes ? new Date(new Date(startDateTime).getTime() + durationMinutes * 60000).toISOString() : endDateTime },
    colorId: getColorForStatus(status) // Assign a color depending on status
  };

  if (eventId) {
    // Update existing event
    return await updateGoogleCalendarEvent(calendar, eventId, eventBody);
  } else {
    // Create new event
    return await createGoogleCalendarEvent(calendar, eventBody);
  }
}

// Function to delete a Google Calendar event by event ID
async function deleteCalendarEvent(calendar, eventId) {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    console.log(`Deleted calendar event: ${eventId}`);
  } catch (error) {
    console.error(`Error deleting calendar event: ${eventId}`, error);
  }
}

// Helper function to assign event colors based on the status
function getColorForStatus(status) {
  switch (status) {
    case 'Confirmed':
      return '10'; // Green
    case 'On Loan':
      return '11'; // Yellow
    case 'Returned':
      return '8';  // Gray
    default:
      return '1';  // Default color
  }
}

// Function to create a Google Calendar event
async function createGoogleCalendarEvent(calendar, eventBody) {
  const event = await calendar.events.insert({
    calendarId: 'primary',
    resource: eventBody,
  });
  return event.data.id;
}

// Function to update a Google Calendar event
async function updateGoogleCalendarEvent(calendar, eventId, eventBody) {
  const event = await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    resource: eventBody,
  });
  return event.data.id;
}
