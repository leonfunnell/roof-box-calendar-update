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
  return JSON.parse(payload);
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

// Main function that handles the webhook request
exports.handler = async (req, res) => {
  try {
    if (req.headers['x-webhook-source'] !== 'roofbox-webhook-router') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = req.body;

    // Initialize Google Calendar API client
    const calendar = await getGoogleCalendarClient();

    // Handle the Google Calendar event operations (create, update, delete, etc.)
    // Example for adding a calendar event based on AppSheet webhook data
    const event = {
      summary: `Booking for ${data.car}`,
      description: `Status: ${data.status}\nPhone: ${data.phone}`,
      start: { dateTime: formatDateTimeToGoogleDateTime(data.pickUpDate) },
      end: { dateTime: formatDateTimeToGoogleDateTime(data.returnDate) },
    };

    const calendarId = data.googleCalendarId || 'primary';
    await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    return res.status(200).json({ message: 'Event added to Google Calendar' });

  } catch (error) {
    console.error('Error processing booking:', error);
    return res.status(500).json({ message: 'Error processing booking', error });
  }
};

// Utility function to convert AppSheet date format to Google Calendar format
function formatDateTimeToGoogleDateTime(dateTimeString) {
  const [date, time] = dateTimeString.split(' ');
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}T${time}`).toISOString();
}
