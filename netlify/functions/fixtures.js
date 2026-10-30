
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Méthode non autorisée" })
      };
    }

    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Clé API non configurée sur Netlify" })
      };
    }

    const date = event.queryStringParameters?.date;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Date invalide. Format attendu : AAAA-MM-JJ" })
      };
    }

    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("date", date);
    url.searchParams.set("timezone", "Africa/Lome");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey
      }
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Impossible de récupérer les matchs."
      })
    };
  }
};
