
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
        body: JSON.stringify({ error: "Clé API non configurée" })
      };
    }

    const fixture = event.queryStringParameters?.fixture;

    if (!fixture || !/^\d+$/.test(fixture)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Identifiant du match invalide" })
      };
    }

    const url = new URL(
      "https://v3.football.api-sports.io/predictions"
    );
    url.searchParams.set("fixture", fixture);

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Erreur API Football"
        })
      };
    }

    const p = data.response?.[0]?.predictions;

    if (!p) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          prediction: null,
          message: "Aucune analyse disponible"
        })
      };
    }

    const percent = p.percent || {};

    const number = value => {
      const n = Number(String(value ?? "").replace("%", ""));
      return Number.isFinite(n) ? n : null;
    };

    const home = number(percent.home);
    const draw = number(percent.draw);
    const away = number(percent.away);

    let doubleChance = "Indisponible";
    let winner = "Indisponible";

    if (home !== null && draw !== null && away !== null) {
      const choices = [
        { name: "1X", value: home + draw },
        { name: "X2", value: away + draw },
        { name: "12", value: home + away }
      ];

      choices.sort((a, b) => b.value - a.value);
      doubleChance = choices[0].name;

      winner =
        home >= draw && home >= away ? "1" :
        draw >= home && draw >= away ? "Nul" : "2";
    }

    let btts = "Indisponible";
    const goalsHome = number(p.goals?.home);
    const goalsAway = number(p.goals?.away);

    if (goalsHome !== null && goalsAway !== null) {
      btts = goalsHome >= 1 && goalsAway >= 1
        ? "OUI"
        : "NON";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=21600"
      },
      body: JSON.stringify({
        prediction: {
          btts,
          doubleChance,
          winner,
          advice: p.advice || "Analyse statistique API Football"
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur pendant l'analyse"
      })
    };
  }
};
