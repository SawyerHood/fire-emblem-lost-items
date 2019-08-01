import items from "./items";
import FuzzySet from "fuzzyset.js";

const ITEM_TO_PERSON = new Map();
const PERSON_TO_ITEMS = new Map();

items.forEach(({ item, person }) => ITEM_TO_PERSON.set(item, person));
items.forEach(({ item, person }) => {
  let arr = PERSON_TO_ITEMS.get(person);
  if (!arr) {
    arr = [];
    PERSON_TO_ITEMS.set(person, arr);
  }
  arr.push(item);
});

window.items = Array.from(PERSON_TO_ITEMS.keys());

const objectArr = items.map(item => item.item);
const fuzz = new FuzzySet(objectArr);

export default function getTableFromOCR(ocrResults) {
  console.log(ocrResults);
  let words = [];
  const resultMap = new Map();
  ocrResults.forEach(res => {
    words = words.concat(res.words.map(r => r.text));
  });

  for (let i = 0; i < words.length; i++) {
    for (let j = 1; j < 5 && i + j < words.length + 1; j++) {
      const str = words.slice(i, i + j).join(" ");
      const searchRes = fuzz.get(str, [], 0.7);
      if (searchRes && searchRes.length) {
        let value = resultMap.get(searchRes[0][1]) || 0;
        resultMap.set(searchRes[0][1], Math.max(searchRes[0][0], value));
      }
    }
  }

  const personToItemTable = new Map();

  resultMap.forEach((confidence, itemName) => {
    const person = ITEM_TO_PERSON.get(itemName);
    let arr = personToItemTable.get(person);
    if (!arr) {
      arr = [];
      personToItemTable.set(person, arr);
    }
    arr.push({ itemName, confidence });
  });

  return personToItemTable;
}
