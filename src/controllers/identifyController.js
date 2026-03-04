const identifyService = require("../services/identityService")

exports.identifyContact = async (req, res) => {
  try {

    const { email, phoneNumber } = req.body

    const result = await identifyService.identify(email, phoneNumber)

    res.status(200).json(result)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Internal server error"
    })

  }
}