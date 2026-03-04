const db = require("../db/database")

exports.identify = async (email, phoneNumber) => {

  return new Promise((resolve, reject) => {

    const query = `
      SELECT * FROM Contact
      WHERE email = ? OR phoneNumber = ?
    `

    db.all(query, [email, phoneNumber], (err, rows) => {

      if (err) return reject(err)

      // CASE 1: No contact exists
      if (rows.length === 0) {

        const insertQuery = `
          INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
          VALUES (?, ?, NULL, 'primary')
        `

        db.run(insertQuery, [email, phoneNumber], function(err) {

          if (err) return reject(err)

          resolve({
            contact: {
              primaryContactId: this.lastID,
              emails: [email],
              phoneNumbers: [phoneNumber],
              secondaryContactIds: []
            }
          })

        })

      }

      // CASE 2: Matching contacts found
      else {

        const primaryContact = rows.reduce((oldest, current) => {
          if (!oldest) return current
          return new Date(current.createdAt) < new Date(oldest.createdAt)
            ? current
            : oldest
        }, null)

        // Merge multiple primaries if present
        const otherPrimaries = rows.filter(
          r => r.linkPrecedence === "primary" && r.id !== primaryContact.id
        )

        otherPrimaries.forEach(contact => {

          const updateQuery = `
            UPDATE Contact
            SET linkedId = ?, linkPrecedence = 'secondary'
            WHERE id = ?
          `

          db.run(updateQuery, [primaryContact.id, contact.id])

          contact.linkedId = primaryContact.id
          contact.linkPrecedence = "secondary"

        })

        // Fetch full identity cluster
        const clusterQuery = `
          SELECT * FROM Contact
          WHERE id = ? OR linkedId = ?
        `

        db.all(clusterQuery, [primaryContact.id, primaryContact.id], (err, clusterRows) => {

          if (err) return reject(err)

          const existingEmails = clusterRows.map(r => r.email)
          const existingPhones = clusterRows.map(r => r.phoneNumber)

          const isNewEmail = email && !existingEmails.includes(email)
          const isNewPhone = phoneNumber && !existingPhones.includes(phoneNumber)

          if (isNewEmail || isNewPhone) {

            const insertQuery = `
              INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
              VALUES (?, ?, ?, 'secondary')
            `

            db.run(insertQuery, [email, phoneNumber, primaryContact.id], function(err) {

              if (err) return reject(err)

              clusterRows.push({
                id: this.lastID,
                email,
                phoneNumber,
                linkedId: primaryContact.id,
                linkPrecedence: "secondary"
              })

              buildResponse(clusterRows, resolve)

            })

          }

          else {
            buildResponse(clusterRows, resolve)
          }

        })

      }

    })

  })

}


function buildResponse(rows, resolve) {

  const primaryContact = rows.find(
    r => r.linkPrecedence === "primary"
  )

  const emails = [
    primaryContact.email,
    ...rows
      .filter(r => r.email && r.email !== primaryContact.email)
      .map(r => r.email)
  ]

  const phoneNumbers = [
    primaryContact.phoneNumber,
    ...rows
      .filter(r => r.phoneNumber && r.phoneNumber !== primaryContact.phoneNumber)
      .map(r => r.phoneNumber)
  ]

  const secondaryContactIds = rows
    .filter(r => r.linkPrecedence === "secondary")
    .map(r => r.id)

  resolve({
    contact: {
      primaryContactId: primaryContact.id,
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phoneNumbers)],
      secondaryContactIds
    }
  })

}