import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WebShop REST API",
      version: "1.0.0",
      description: "Dokumentacja API Twojego sklepu internetowego",
    },
    servers: [
      {
        url: "http://localhost:3006",
      },
    ],
  },

  // Gdzie Swagger ma szukać opisów endpointów
  apis: ["./index.js", "./routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Funkcja eksportowana do użycia w server.js
export const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  console.log("📘 Swagger dostępny pod: http://localhost:3006/api-docs");
};
