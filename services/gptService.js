const axios = require("axios");
const { GPT_API_KEY } = require("../config/config");

exports.callGPT = async (prompt) => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] },
    {
      headers: {
        Authorization: `Bearer ${GPT_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].message.content
    .replaceAll("<JSON>", "")
    .replaceAll("</JSON>", "")
    .replaceAll("`", "")
    .replaceAll("json", "");
};
