const PersonalizationService = require('./backend/services/personalizationService');
const db = require('./backend/db');

async function test() {
    try {
        const retailerId = 1; // Assuming 1 exists, or we get empty arrays
        console.log("Testing Reorder Suggestions...");
        const suggestions = await PersonalizationService.getSmartReorderSuggestions(retailerId);
        console.log(suggestions);

        console.log("\nTesting Product List...");
        const productList = await PersonalizationService.getPersonalizedProductList(retailerId);
        console.log(productList);

        console.log("\nTesting Score...");
        const score = await PersonalizationService.getRetailerScore(retailerId);
        console.log(score);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
