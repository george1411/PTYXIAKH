import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY } from "./env.js";


const aj = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "DRY_RUN",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:BROWSER",
      ],
    }),

    tokenBucket({
      mode: "LIVE",
      refillRate: 60,
      interval: 10,
      capacity: 120,
    }),
  ],
});

export default aj;