import { IAttribute } from "../interfaces/attribute.interfaces.js";
import { IHero } from "../interfaces/hero.interfaces.js";
import { ITeam } from "../interfaces/team.interface.js";
import { Hero } from "../models/hero.model.js";
import { heroType, subHeroType } from "../types/hero.type.js";
import dotenv from 'dotenv';
import logger from "./logger.js";
import npcs from '../assets/ia-templates/npcs.json' assert { type: 'json' };
import { IProduct } from "../interfaces/product.interfaces.js";
dotenv.config();

const url: string = process.env.API_URL || 'http://127.0.0.1:5000/api/ai/habilities';

export class AIUtil {
    static convertToAttribute(attribute: any): IAttribute {
        return {
            name: attribute.name,
            value: attribute.value,
            valueMin: attribute.valueMin,
            valueMax: attribute.valueMax,
            valueConstant: attribute.valueConstant,
            clone: function(): IAttribute {
                return { ...this };
            }
        };
    }

    static addGeneratedAiToTeam(team: ITeam, aiMap: Map<string, IHero>, productsMatch: Map<string, IProduct>): void {
        const npcHeroes = Object.values(npcs);

        const randomIndex = Math.floor(Math.random() * npcHeroes.length);
        const randomNpc = npcHeroes[randomIndex];

        const attributesArray: IAttribute[] = Object.values(randomNpc.attributes).map(this.convertToAttribute);

        const products: IProduct[] = randomNpc.products.map((p: any) => ({
            ...p,
            isNull: () => false,
        }));

        const baseId = randomNpc.idUser.slice(0, 5);
        const uniqueId = `${baseId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const newAiHero: IHero = new Hero(
            uniqueId,
            "AI",
            "123",
            randomNpc.type as heroType,
            randomNpc.subtype as subHeroType,
            attributesArray,
            products,
            team.teamSide
        );

        team.addHero(newAiHero);

        aiMap.set(uniqueId, newAiHero);

        newAiHero.products.forEach((product) => {
            if (productsMatch.get(product.idProduct) == undefined)
                productsMatch.set(product.idProduct, product);
        });

        logger.info(`AI Hero added to ${team.teamSide} team with id: ${uniqueId}`);
    }

    static addPlayerAiToTeam(team: ITeam, aiMap: Map<string, IHero>, productsMatch: Map<string, IProduct>, playerHero: IHero): void {

        const attributesArray: IAttribute[] = Object.values(playerHero.attributes).map(this.convertToAttribute);

        const products: IProduct[] = playerHero.products.map((p: any) => ({
            ...p,
            isNull: () => false,
        }));

        const baseId = playerHero.idUser.slice(0, 5);
        const uniqueId = `${baseId}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const newAiHero: IHero = new Hero(
            uniqueId,
            playerHero.nameUser ?? 'AI Player',
            playerHero.idHero ?? '123',
            playerHero.type as heroType,
            playerHero.subtype as subHeroType,
            attributesArray,
            products,
            team.teamSide
        );

        team.addHero(newAiHero);

        aiMap.set(uniqueId, newAiHero);

        newAiHero.products.forEach((product) => {
            if (productsMatch.get(product.idProduct) == undefined)
                productsMatch.set(product.idProduct, product);
        });

        logger.info(`AI Hero added to ${team.teamSide} team with id: ${uniqueId}`);
    }

    static callAiAPI(aiHero: IHero, victim: IHero): Promise<string> {
        const params = this.parseToApi(aiHero, victim);

        async function sendRequest(): Promise<string> {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });

                if (response.ok) {
                    const data = await response.json(); 
                    return AIUtil.filterHabilityByHero(aiHero, data);
                } else {
                    logger.error(`Error en la solicitud: ${response.status}, ${response.statusText}`);
                    return "pailaLaApiNoRespondioPaseTurnoPorqueQueMas";
                }
            } catch (error) {
                logger.error(`Error en la solicitud ${error}`);
                return "pailaLaApiNoRespondioPaseTurnoPorqueQueMas";
            }
        }

        return sendRequest();
    }

    static parseToApi(aiHero: IHero, victim: IHero): number[][] {
        const heroTypes = ['warrior-tank', 'warrior-weapon', 'wizard-fire', 'wizard-ice', 'rogue-poison', 'rogue-machete'];
        const heroTypeBinary = heroTypes.map(type => (aiHero.type + '-' + aiHero.subtype) === type ? 1 : 0);

        const attributeKeys = ['health', 'defense', 'power', 'attack-min', 'attack-max', 'damage-min', 'damage-max'];
        const aiHeroAttributes = attributeKeys.map(attr => aiHero.attributes[attr]?.value || 0);

        const allHabilities = [
            "Golpe básico", "Golpe con escudo", "Mano de piedra", "Defensa feroz", "Golpe de defensa", "Embate sangriento", 
            "Lanza de los dioses", "Golpe de tormenta", "Segundo Impulso", "Misiles de magma", "Vulcano", "Pare de fuego", 
            "Luz cegadora", "Lluvia de hielo", "Cono de hielo", "Bola de hielo", "Frio concentrado", "Flor de loto", 
            "Agonia", "Piquete", "Toma y lleva", "Cortada", "Machetazo", "Planazo", "Intimidación sangrienta"
        ];

        const aiHeroHabilitiesBinary = allHabilities.map(hability => 
            aiHero.products.some(product => product.productName === hability) ? 1 : 0
        );

        const victimAttributes = attributeKeys.map(attr => victim.attributes[attr]?.value || 0);

        const requestData = [
            heroTypeBinary,           // Matriz binaria de type y subtype de aiHero
            aiHeroAttributes,         // Atributos de aiHero
            aiHeroHabilitiesBinary,   // Habilidades de aiHero
            victimAttributes          // Atributos de victim
        ];

        return requestData;
    }

    // revisa si el heroe tiene la habilidad, regresa la primera habilidad que tenga
    static filterHabilityByHero(aiHero: IHero, habilities: string[]): string {
        for (const hability of habilities)
            for (const product of aiHero.products) 
                if (product.productName === hability) return product.idProduct;

        // TODO poner aqui la hábilidad base que todos tienen
        return "20";
    }
}