exports.handler = async function() {
  try {
    const res = await fetch('https://openrouter.ai/');
    return {
      statusCode: 200,
      body: JSON.stringify({ status: res.status }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
