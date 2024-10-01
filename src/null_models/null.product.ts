import { Product } from "../models/product.model.js";

export class NullProduct extends Product {
    constructor() {
        super(
            "idProduct",
            "productName",
            "productDescription",
            "item",
            "rogue",
            "fire",
            "dropChance",
            [],
            [],
            "imagePath",
            0
        );
    }

    isNull(): boolean {
        return true;
    }
}
