import score from '../model/ElephantModel';
import mappings from '../model/mappings.json';

export const predictRisk = (distance, speed, behavior, count, structure, weather) => {
    try {
        const findIndex = (array, input) => {
            if (!array || !input) return -1;
            const idx = array.indexOf(input);
            if (idx !== -1) return idx;
            return array.findIndex(item => item.toLowerCase().trim() === input.toString().toLowerCase().trim());
        };

        const behaviorIdx = findIndex(mappings.behavior, behavior);
        const structureIdx = findIndex(mappings.social, structure);
        const weatherIdx = findIndex(mappings.weather, weather);

        if (behaviorIdx === -1 || structureIdx === -1 || weatherIdx === -1) {
            return null;
        }

        const features = [
            parseFloat(distance),
            parseFloat(speed),
            behaviorIdx,
            parseInt(count),
            structureIdx,
            weatherIdx
        ];

        // 1. Get the probabilities from the model
        const probabilities = score(features); 
        // Example output: [0.19, 0, 0.81]

        // 2. Find the index of the HIGHEST probability
        // In the example [0.19, 0, 0.81], the max is 0.81 at Index 2
        let predictionIdx = 0;
        if (Array.isArray(probabilities)) {
            predictionIdx = probabilities.indexOf(Math.max(...probabilities));
        } else {
            predictionIdx = probabilities; // Fallback if it's already a single number
        }

        console.log("Highest Probability Index:", predictionIdx);

        // 3. Return the mapped string ("medium" in the example above)
        return mappings.risk[predictionIdx];
        
    } catch (error) {
        console.error("Service Crash:", error);
        return null;
    }
};