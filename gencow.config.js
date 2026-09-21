/** @type {import('@gencow/core').GencowConfig} */
export default {
    rootDir: "./gencow",
    schema: ["./gencow/schema-auth.ts", "./gencow/schema.ts"],
    codegen: {
        // Optional: where generated frontend codegen artifacts are written.
        // Default: "./src/gencow".
        outDir: "./src/gencow",
        // Optional: db-schema.gen.ts + schema-auth.gen.ts; default is "./gencow/generated".
        // serverOutDir: "./gencow/generated",
        // Set false if you fully own Better Auth schema files.
        authSchema: { emitRelations: true },
    },
    storage: "./.gencow/uploads",
    db: { url: "./.gencow/data" },
    port: Number(process.env.PORT ?? 5456),
    // Public frontend origins for API CORS and auth flows.
    // frontendOrigins: ["https://my-app.vercel.app"],
    // Legacy escape hatch for advanced local integrations:
    // trustedOrigins: ["http://localhost:*"],
};
