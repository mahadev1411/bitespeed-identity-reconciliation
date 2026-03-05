**Identity Reconciliation Service**

This repository contains the implementation of the Identity Reconciliation backend service for the BiteSpeed assignment.

The purpose of this service is to determine whether different combinations of email addresses and phone numbers belong to the same customer. In real systems, a user might interact with a platform using different identifiers over time — for example, using a different email address while keeping the same phone number, or vice-versa.

The service links such contacts together and returns a consolidated identity for that customer.

The application exposes a single endpoint that accepts an email and/or phone number and returns the resolved identity information.

Tech Stack

Node.js

Express.js

SQLite

-> SQLite is used for simplicity so the project can run locally without requiring an external database setup.


Each record contains the following fields:

id — unique identifier for the contact

email — email address of the contact

phoneNumber — phone number of the contact

linkedId — references the primary contact if the record is secondary

linkPrecedence — indicates whether the contact is primary or secondary

createdAt — timestamp when the contact was created

updatedAt — timestamp when the contact was last updated

deletedAt — timestamp for soft deletion

A primary contact represents the root identity.

linkedId = NULL
linkPrecedence = primary

A secondary contact is linked to a primary contact.

linkedId = primaryContactId
linkPrecedence = secondary
Identity Resolution Logic

When a request is received at the /identify endpoint, the service performs the following steps:

Search the database for contacts matching the provided email or phone number.

If no matching contact exists, create a new primary contact.

If matching contacts exist:

Determine the primary contact for that identity.

Retrieve all contacts linked to that primary contact.

If the request introduces new information (for example a new email or phone number), create a secondary contact linked to the primary identity.

If the email and phone number correspond to two different identities, the identities are merged. The oldest contact remains the primary and the other is converted into a secondary contact.

The response always returns the complete identity cluster.

API
**POST /identify**

This endpoint identifies or creates a customer identity.

Request Body
{
  "email": "string",
  "phoneNumber": "string"
}

Either email or phoneNumber must be provided.

Example Request
POST /identify
{
  "email": "doc@fluxkart.com",
  "phoneNumber": "123456"
}
Example Response
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "doc@fluxkart.com",
      "doc2@fluxkart.com"
    ],
    "phoneNumbers": [
      "123456",
      "999999"
    ],
    "secondaryContactIds": [2, 3]
  }
}
Running the Project Locally

Clone the repository:

git clone https://github.com/mahadev1411/bitespeed-identity-reconciliation.git

Navigate into the project directory:

cd bitespeed-identity-reconciliation

Install dependencies:

npm install

Start the server:

npm run dev

The server will start on:

http://localhost:3000

**Notes:**
The oldest contact in an identity group is always maintained as the primary contact.

All related contacts are returned together as part of the same identity cluster.

Duplicate contacts are avoided when the same information is sent multiple times.


