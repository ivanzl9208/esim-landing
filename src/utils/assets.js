// Static, browser-independent. Replace this one resolver with the Nuxt baseURL
// when integrating; components never read a global runtime configuration.
export const asset = (name) => `${import.meta.env.BASE_URL ?? '/'}assets/${name}`;
