// Local food database — 100+ common foods for instant search without API calls
// Structure: { name, brand?, cal, protein, fat, carbs, fiber?, servingSize }

export const COMMON_FOODS = [
  // ─── Fruits & Simple Foods ───
  { name: 'Banana', cal: 105, protein: 1, fat: 0, carbs: 27, fiber: 3, servingSize: '1 medium' },
  { name: 'Apple', cal: 95, protein: 0, fat: 0, carbs: 25, fiber: 4, servingSize: '1 medium' },
  { name: 'Orange', cal: 62, protein: 1, fat: 0, carbs: 15, fiber: 3, servingSize: '1 medium' },
  { name: 'Strawberries', cal: 50, protein: 1, fat: 0, carbs: 12, fiber: 3, servingSize: '1 cup' },
  { name: 'Blueberries', cal: 84, protein: 1, fat: 0, carbs: 21, fiber: 4, servingSize: '1 cup' },
  { name: 'Avocado', cal: 240, protein: 3, fat: 22, carbs: 13, fiber: 10, servingSize: '1 whole' },
  { name: 'Grapes', cal: 104, protein: 1, fat: 0, carbs: 27, fiber: 1, servingSize: '1 cup' },

  // ─── Breakfast ───
  { name: 'Overnight Oats', cal: 300, protein: 12, fat: 6, carbs: 50, fiber: 6, servingSize: '1 cup' },
  { name: 'Oatmeal', cal: 150, protein: 5, fat: 3, carbs: 27, fiber: 4, servingSize: '1 cup cooked' },
  { name: 'Scrambled Eggs', cal: 180, protein: 14, fat: 13, carbs: 2, servingSize: '3 large eggs' },
  { name: 'Hard Boiled Eggs', cal: 210, protein: 18, fat: 15, carbs: 2, servingSize: '3 eggs' },
  { name: 'Fried Egg', cal: 90, protein: 6, fat: 7, carbs: 0, servingSize: '1 large' },
  { name: 'Egg White Omelette', cal: 100, protein: 20, fat: 0, carbs: 2, servingSize: '4 egg whites' },
  { name: 'Greek Yogurt', cal: 100, protein: 17, fat: 0, carbs: 6, servingSize: '3/4 cup' },
  { name: 'Chobani Zero Sugar Yogurt', brand: 'Chobani', cal: 80, protein: 15, fat: 0, carbs: 6, servingSize: '5.3 oz' },
  { name: 'Chobani Plain Greek Yogurt', brand: 'Chobani', cal: 120, protein: 20, fat: 0, carbs: 8, servingSize: '6 oz' },
  { name: 'Bagel', cal: 270, protein: 10, fat: 2, carbs: 53, servingSize: '1 plain bagel' },
  { name: 'English Muffin', cal: 130, protein: 5, fat: 1, carbs: 26, servingSize: '1 muffin' },
  { name: 'Toast', cal: 79, protein: 3, fat: 1, carbs: 15, servingSize: '1 slice whole wheat' },
  { name: 'Pancakes', cal: 300, protein: 8, fat: 8, carbs: 48, servingSize: '3 medium pancakes' },
  { name: 'Waffle', cal: 200, protein: 5, fat: 8, carbs: 28, servingSize: '1 waffle' },

  // ─── Protein Foods ───
  { name: 'Chicken Breast', cal: 165, protein: 31, fat: 4, carbs: 0, servingSize: '4 oz cooked' },
  { name: 'Ground Turkey', cal: 220, protein: 28, fat: 12, carbs: 0, servingSize: '4 oz cooked' },
  { name: 'Salmon', cal: 206, protein: 28, fat: 10, carbs: 0, servingSize: '4 oz' },
  { name: 'Tuna Can', cal: 120, protein: 26, fat: 1, carbs: 0, servingSize: '1 can (5 oz)' },
  { name: 'Ground Beef 80/20', cal: 300, protein: 28, fat: 20, carbs: 0, servingSize: '4 oz cooked' },
  { name: 'Pork Tenderloin', cal: 120, protein: 22, fat: 3, carbs: 0, servingSize: '3 oz' },
  { name: 'Shrimp', cal: 84, protein: 18, fat: 1, carbs: 0, servingSize: '3 oz cooked' },
  { name: 'Cottage Cheese', cal: 110, protein: 13, fat: 2, carbs: 6, servingSize: '1/2 cup' },
  { name: 'String Cheese', cal: 80, protein: 7, fat: 5, carbs: 1, servingSize: '1 stick' },
  { name: 'Rotisserie Chicken', cal: 220, protein: 35, fat: 9, carbs: 0, servingSize: '4 oz' },

  // ─── Snacks & Bars ───
  { name: 'Kirkland Protein Bar', brand: 'Kirkland', cal: 190, protein: 21, fat: 8, carbs: 20, fiber: 14, servingSize: '1 bar' },
  { name: 'Quest Bar', brand: 'Quest', cal: 200, protein: 20, fat: 8, carbs: 21, fiber: 14, servingSize: '1 bar (60g)' },
  { name: 'Kind Bar', brand: 'KIND', cal: 200, protein: 6, fat: 15, carbs: 17, fiber: 3, servingSize: '1 bar' },
  { name: 'RX Bar', brand: 'RXBAR', cal: 210, protein: 12, fat: 9, carbs: 23, fiber: 5, servingSize: '1 bar (52g)' },
  { name: 'Almonds', cal: 164, protein: 6, fat: 14, carbs: 6, fiber: 3, servingSize: '1 oz (23 nuts)' },
  { name: 'Mixed Nuts', cal: 170, protein: 5, fat: 15, carbs: 7, servingSize: '1 oz' },
  { name: 'Peanut Butter', cal: 190, protein: 8, fat: 16, carbs: 7, fiber: 2, servingSize: '2 tbsp' },
  { name: 'Hummus', cal: 70, protein: 3, fat: 5, carbs: 6, fiber: 2, servingSize: '2 tbsp' },
  { name: 'String Cheese and Jerky', cal: 200, protein: 22, fat: 9, carbs: 3, servingSize: '1 stick + 1 oz jerky' },
  { name: 'Beef Jerky', cal: 116, protein: 14, fat: 5, carbs: 4, servingSize: '1 oz' },
  { name: 'Protein Shake', cal: 150, protein: 25, fat: 3, carbs: 8, servingSize: '1 scoop in water' },
  { name: 'Whey Protein Shake', cal: 120, protein: 24, fat: 1, carbs: 3, servingSize: '1 scoop' },

  // ─── Rice, Grains & Carbs ───
  { name: 'White Rice', cal: 206, protein: 4, fat: 0, carbs: 45, servingSize: '1 cup cooked' },
  { name: 'Brown Rice', cal: 216, protein: 5, fat: 2, carbs: 45, fiber: 4, servingSize: '1 cup cooked' },
  { name: 'Pasta', cal: 220, protein: 8, fat: 1, carbs: 43, servingSize: '2 oz dry (1 cup cooked)' },
  { name: 'Quinoa', cal: 222, protein: 8, fat: 4, carbs: 39, fiber: 5, servingSize: '1 cup cooked' },
  { name: 'Sweet Potato', cal: 103, protein: 2, fat: 0, carbs: 24, fiber: 4, servingSize: '1 medium' },
  { name: 'Baked Potato', cal: 160, protein: 4, fat: 0, carbs: 37, fiber: 4, servingSize: '1 medium' },
  { name: 'Bread', cal: 79, protein: 3, fat: 1, carbs: 15, servingSize: '1 slice' },
  { name: 'Tortilla', cal: 130, protein: 3, fat: 3, carbs: 22, servingSize: '1 flour tortilla (8 in)' },

  // ─── Vegetables ───
  { name: 'Broccoli', cal: 55, protein: 4, fat: 0, carbs: 11, fiber: 5, servingSize: '1 cup' },
  { name: 'Salad (side)', cal: 25, protein: 2, fat: 0, carbs: 5, fiber: 2, servingSize: '2 cups greens' },
  { name: 'Spinach', cal: 7, protein: 1, fat: 0, carbs: 1, servingSize: '1 cup raw' },

  // ─── McDonald's ───
  { name: 'Big Mac', brand: "McDonald's", cal: 550, protein: 25, fat: 30, carbs: 45, fiber: 3, servingSize: '1 burger' },
  { name: 'McDouble', brand: "McDonald's", cal: 400, protein: 23, fat: 20, carbs: 34, servingSize: '1 burger' },
  { name: "McDonald's Chicken McNuggets 10pc", brand: "McDonald's", cal: 430, protein: 25, fat: 26, carbs: 27, servingSize: '10 pieces' },
  { name: 'McChicken', brand: "McDonald's", cal: 400, protein: 14, fat: 17, carbs: 42, servingSize: '1 sandwich' },
  { name: 'Quarter Pounder', brand: "McDonald's", cal: 510, protein: 30, fat: 26, carbs: 42, servingSize: '1 burger' },
  { name: "McDonald's Large Fries", brand: "McDonald's", cal: 490, protein: 7, fat: 23, carbs: 66, servingSize: '1 large' },
  { name: "Egg McMuffin", brand: "McDonald's", cal: 300, protein: 17, fat: 12, carbs: 30, servingSize: '1 sandwich' },

  // ─── Burger King ───
  { name: 'Whopper', brand: 'Burger King', cal: 660, protein: 28, fat: 40, carbs: 49, fiber: 2, servingSize: '1 burger' },
  { name: 'Impossible Whopper', brand: 'Burger King', cal: 630, protein: 25, fat: 34, carbs: 58, fiber: 4, servingSize: '1 burger' },

  // ─── Chipotle ───
  { name: 'Chipotle Chicken Burrito', brand: 'Chipotle', cal: 1045, protein: 55, fat: 35, carbs: 120, fiber: 10, servingSize: '1 burrito' },
  { name: 'Chipotle Chicken Burrito (extra protein)', brand: 'Chipotle', cal: 1100, protein: 65, fat: 37, carbs: 121, fiber: 10, servingSize: '1 burrito + double chicken' },
  { name: 'Chipotle Chicken Bowl', brand: 'Chipotle', cal: 740, protein: 55, fat: 22, carbs: 78, fiber: 14, servingSize: '1 bowl (rice+beans+chicken)' },
  { name: 'Chipotle Chicken Bowl (extra protein)', brand: 'Chipotle', cal: 795, protein: 65, fat: 24, carbs: 79, fiber: 14, servingSize: '1 bowl + double chicken' },
  { name: 'Chipotle Chips and Guacamole', brand: 'Chipotle', cal: 770, protein: 7, fat: 43, carbs: 89, fiber: 12, servingSize: '1 bag chips + guac' },
  { name: 'Chipotle Chicken Quesadilla', brand: 'Chipotle', cal: 830, protein: 48, fat: 43, carbs: 68, fiber: 4, servingSize: '1 quesadilla' },
  { name: 'Chipotle Chicken Tacos', brand: 'Chipotle', cal: 500, protein: 34, fat: 18, carbs: 52, servingSize: '3 tacos' },
  { name: 'Chipotle Steak Bowl', brand: 'Chipotle', cal: 760, protein: 54, fat: 24, carbs: 79, fiber: 14, servingSize: '1 bowl' },
  { name: 'Chipotle Veggie Bowl', brand: 'Chipotle', cal: 620, protein: 18, fat: 18, carbs: 90, fiber: 20, servingSize: '1 bowl' },

  // ─── Taco Bell ───
  { name: 'Taco Bell Crunchy Taco', brand: 'Taco Bell', cal: 170, protein: 8, fat: 9, carbs: 13, servingSize: '1 taco' },
  { name: 'Taco Bell Soft Taco', brand: 'Taco Bell', cal: 180, protein: 9, fat: 8, carbs: 20, servingSize: '1 taco' },
  { name: 'Taco Bell Chicken Quesadilla', brand: 'Taco Bell', cal: 520, protein: 28, fat: 27, carbs: 43, servingSize: '1 quesadilla' },
  { name: 'Taco Bell Bean Burrito', brand: 'Taco Bell', cal: 380, protein: 14, fat: 11, carbs: 57, servingSize: '1 burrito' },
  { name: 'Doritos Locos Taco', brand: 'Taco Bell', cal: 170, protein: 8, fat: 9, carbs: 14, servingSize: '1 taco' },

  // ─── Subway ───
  { name: 'Subway 6-inch Turkey', brand: 'Subway', cal: 280, protein: 18, fat: 4, carbs: 43, servingSize: '6-inch sandwich' },
  { name: 'Subway 6-inch Italian BMT', brand: 'Subway', cal: 410, protein: 20, fat: 17, carbs: 44, servingSize: '6-inch sandwich' },
  { name: 'Subway 6-inch Tuna', brand: 'Subway', cal: 480, protein: 20, fat: 25, carbs: 44, servingSize: '6-inch sandwich' },
  { name: 'Subway 6-inch Chicken Teriyaki', brand: 'Subway', cal: 370, protein: 25, fat: 6, carbs: 53, servingSize: '6-inch sandwich' },
  { name: 'Subway Footlong Turkey', brand: 'Subway', cal: 560, protein: 36, fat: 8, carbs: 86, servingSize: '12-inch sandwich' },

  // ─── Whataburger (Texas specific) ───
  { name: 'Whataburger', brand: 'Whataburger', cal: 590, protein: 30, fat: 27, carbs: 58, servingSize: '1 burger' },
  { name: 'Whataburger Double', brand: 'Whataburger', cal: 880, protein: 51, fat: 46, carbs: 60, servingSize: '1 burger' },
  { name: 'Whataburger Breakfast on a Bun', brand: 'Whataburger', cal: 400, protein: 21, fat: 20, carbs: 35, servingSize: '1 sandwich' },
  { name: 'Whataburger French Fries Medium', brand: 'Whataburger', cal: 380, protein: 5, fat: 17, carbs: 52, servingSize: '1 medium' },

  // ─── Chick-fil-A ───
  { name: 'Chick-fil-A Chicken Sandwich', brand: 'Chick-fil-A', cal: 440, protein: 28, fat: 19, carbs: 40, servingSize: '1 sandwich' },
  { name: 'Chick-fil-A Nuggets 8pc', brand: 'Chick-fil-A', cal: 260, protein: 27, fat: 12, carbs: 12, servingSize: '8 pieces' },
  { name: 'Chick-fil-A Grilled Chicken Sandwich', brand: 'Chick-fil-A', cal: 320, protein: 29, fat: 6, carbs: 40, servingSize: '1 sandwich' },
  { name: 'Chick-fil-A Waffle Fries', brand: 'Chick-fil-A', cal: 360, protein: 4, fat: 18, carbs: 45, servingSize: '1 medium' },

  // ─── Restaurant Dishes ───
  { name: 'Pizza Slice', cal: 280, protein: 12, fat: 10, carbs: 36, servingSize: '1 slice (cheese)' },
  { name: 'Chicken Tikka Masala', cal: 350, protein: 28, fat: 15, carbs: 25, servingSize: '1 cup' },
  { name: 'Pad Thai', cal: 450, protein: 18, fat: 15, carbs: 65, servingSize: '1 serving' },
  { name: 'Sushi Roll', cal: 200, protein: 8, fat: 4, carbs: 34, servingSize: '8-piece roll' },
  { name: 'Caesar Salad', cal: 470, protein: 12, fat: 38, carbs: 20, servingSize: 'restaurant serving' },
  { name: 'Chicken Caesar Salad', cal: 580, protein: 35, fat: 40, carbs: 22, servingSize: 'restaurant serving' },
  { name: 'Burrito Bowl (generic)', cal: 700, protein: 40, fat: 20, carbs: 85, servingSize: '1 bowl' },
  { name: 'Grilled Chicken Sandwich', cal: 380, protein: 32, fat: 10, carbs: 38, servingSize: '1 sandwich' },
  { name: 'Club Sandwich', cal: 590, protein: 35, fat: 25, carbs: 54, servingSize: '1 sandwich' },
  { name: 'Chicken and Rice Bowl', cal: 600, protein: 40, fat: 10, carbs: 80, servingSize: '1 bowl' },
  { name: 'Soup (chicken noodle)', cal: 120, protein: 8, fat: 3, carbs: 15, servingSize: '1 cup' },
  { name: 'Cheeseburger', cal: 350, protein: 20, fat: 16, carbs: 33, servingSize: '1 burger' },

  // ─── Drinks ───
  { name: 'Orange Juice', cal: 112, protein: 2, fat: 0, carbs: 26, servingSize: '8 oz' },
  { name: 'Milk (2%)', cal: 122, protein: 8, fat: 5, carbs: 12, servingSize: '8 oz' },
  { name: 'Almond Milk', cal: 30, protein: 1, fat: 3, carbs: 1, servingSize: '8 oz unsweetened' },
  { name: 'Coffee (black)', cal: 5, protein: 0, fat: 0, carbs: 1, servingSize: '8 oz' },
  { name: 'Latte', cal: 100, protein: 6, fat: 4, carbs: 10, servingSize: '12 oz (2% milk)' },
  { name: 'Protein Coffee', cal: 150, protein: 20, fat: 2, carbs: 8, servingSize: '12 oz' },

  // ─── Meal Prep / Jason's foods ───
  { name: 'Chicken and Tofu Bowl', cal: 600, protein: 40, fat: 12, carbs: 65, servingSize: '1 bowl' },
  { name: 'Chicken Fajita Tacos', cal: 750, protein: 48, fat: 20, carbs: 75, servingSize: '3 tacos' },
  { name: 'Rotisserie Chicken and Rice', cal: 700, protein: 50, fat: 15, carbs: 75, servingSize: '1 serving' },
  { name: 'Turkey Deli Wrap', cal: 500, protein: 38, fat: 12, carbs: 50, servingSize: '1 wrap' },
  { name: 'Salmon and Sweet Potato', cal: 650, protein: 45, fat: 18, carbs: 55, servingSize: '1 plate' },
  { name: 'Cottage Cheese and Berries', cal: 180, protein: 22, fat: 2, carbs: 18, servingSize: '1 cup + 1/2 cup berries' },

  // ─── HEB / Grocery (Texas) ───
  { name: 'HEB Meal Simple Chicken', brand: 'HEB', cal: 220, protein: 35, fat: 6, carbs: 6, servingSize: '1 serving' },
  { name: 'Fairlife Milk', brand: 'Fairlife', cal: 120, protein: 13, fat: 5, carbs: 6, servingSize: '8 oz' },

  // ─── More Fast Food ───
  { name: "McDonald's Small Fries", brand: "McDonald's", cal: 220, protein: 3, fat: 10, carbs: 30, servingSize: '1 small' },
  { name: "McDonald's Medium Fries", brand: "McDonald's", cal: 320, protein: 4, fat: 15, carbs: 43, servingSize: '1 medium' },
  { name: "McDonald's 6pc McNuggets", brand: "McDonald's", cal: 270, protein: 15, fat: 16, carbs: 16, servingSize: '6 pieces' },
  { name: 'Chick-fil-A Deluxe Sandwich', brand: 'Chick-fil-A', cal: 500, protein: 36, fat: 22, carbs: 44, servingSize: '1 sandwich' },
  { name: 'Chick-fil-A Nuggets 12pc', brand: 'Chick-fil-A', cal: 380, protein: 40, fat: 18, carbs: 18, servingSize: '12 pieces' },
  { name: 'Taco Bell Burrito Supreme', brand: 'Taco Bell', cal: 400, protein: 17, fat: 16, carbs: 51, servingSize: '1 burrito' },
  { name: 'Taco Bell Nachos BellGrande', brand: 'Taco Bell', cal: 740, protein: 20, fat: 38, carbs: 80, servingSize: '1 order' },
  { name: 'Subway Footlong Italian BMT', brand: 'Subway', cal: 820, protein: 40, fat: 34, carbs: 88, servingSize: '12-inch sandwich' },
  { name: 'Whataburger Jr.', brand: 'Whataburger', cal: 310, protein: 16, fat: 13, carbs: 33, servingSize: '1 burger' },
  { name: 'Chipotle Chips and Guac', brand: 'Chipotle', cal: 770, protein: 9, fat: 44, carbs: 88, fiber: 14, servingSize: '1 order' },
  { name: 'Firehouse Hook & Ladder Medium', brand: 'Firehouse Subs', cal: 680, protein: 40, fat: 24, carbs: 68, servingSize: '1 medium sub' },

  // ─── More Chicken Sizes ───
  { name: 'Chicken Breast 6oz', cal: 248, protein: 46, fat: 5, carbs: 0, servingSize: '6 oz cooked' },
  { name: 'Chicken Breast 8oz', cal: 330, protein: 62, fat: 7, carbs: 0, servingSize: '8 oz cooked' },
  { name: 'Ground Beef 4oz', cal: 290, protein: 20, fat: 23, carbs: 0, servingSize: '4 oz 80/20 cooked' },
  { name: 'Salmon 6oz', cal: 309, protein: 42, fat: 15, carbs: 0, servingSize: '6 oz cooked' },
  { name: 'Rotisserie Chicken Quarter', cal: 330, protein: 53, fat: 14, carbs: 0, servingSize: '1 quarter (leg+thigh)' },

  // ─── Eggs ───
  { name: '1 Egg', cal: 72, protein: 6, fat: 5, carbs: 0, servingSize: '1 large egg' },
  { name: '2 Eggs', cal: 144, protein: 13, fat: 10, carbs: 1, servingSize: '2 large eggs' },
  { name: '3 Eggs', cal: 216, protein: 19, fat: 14, carbs: 1, servingSize: '3 large eggs' },

  // ─── More Dairy ───
  { name: 'Whole Milk', cal: 149, protein: 8, fat: 8, carbs: 12, servingSize: '1 cup (8 oz)' },
  { name: 'Skim Milk', cal: 83, protein: 8, fat: 0, carbs: 12, servingSize: '1 cup (8 oz)' },
  { name: 'Cheddar Cheese', cal: 113, protein: 7, fat: 9, carbs: 0, servingSize: '1 oz' },

  // ─── More Drinks ───
  { name: 'Coca-Cola', cal: 140, protein: 0, fat: 0, carbs: 39, servingSize: '12 oz can' },
  { name: 'Beer', cal: 153, protein: 1, fat: 0, carbs: 13, servingSize: '12 oz regular beer' },
  { name: 'Wine', cal: 125, protein: 0, fat: 0, carbs: 4, servingSize: '5 oz glass' },

  // ─── More Snacks ───
  { name: 'Chips', cal: 155, protein: 2, fat: 10, carbs: 15, servingSize: '1 oz bag' },

  // ─── More Prepared ───
  { name: 'Overnight Oats with Protein', cal: 420, protein: 35, fat: 8, carbs: 55, fiber: 6, servingSize: '1 cup + 1 scoop protein' },
  { name: 'Chicken and Rice Bowl', cal: 600, protein: 40, fat: 10, carbs: 80, servingSize: '1 meal prep bowl' },
  { name: 'Chicken Fajita Tacos 3pc', cal: 750, protein: 48, fat: 20, carbs: 75, servingSize: '3 tacos' },
];

// Search local food database
export function searchLocalFoods(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 1);

  const scored = COMMON_FOODS.map(food => {
    const haystack = `${food.name} ${food.brand || ''}`.toLowerCase();
    let score = 0;
    if (haystack === q) score = 100;
    else if (haystack.startsWith(q)) score = 80;
    else if (haystack.includes(q)) score = 60;
    else {
      const matchedWords = words.filter(w => haystack.includes(w));
      score = (matchedWords.length / words.length) * 40;
    }
    return { food, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ food }) => food);
}
