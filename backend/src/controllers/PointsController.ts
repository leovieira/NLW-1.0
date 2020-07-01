import { Request, Response } from "express";
import knex from "../database/connection";

class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    const serializedPoints = points.map((point) => {
      return {
        ...point,
        image_url: `http://192.168.0.105:3333/uploads/${point.image}`,
      };
    });

    return response.json(serializedPoints);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return response.status(400).json({ message: "Point not found." });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.0.105:3333/uploads/${point.image}`,
    };

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.title");

    return response.json({ point: serializedPoint, items });
  }

  async create(request: Request, response: Response) {
    try {
      var image = "";

      if (request.file !== undefined && request.file.filename !== "") {
        image = request.file.filename;
      }

      const { name, email, whatsapp, city, uf, items } = request.body;

      const latitude = Number(request.body.latitude);
      const longitude = Number(request.body.longitude);

      if (
        image !== "" &&
        name !== "" &&
        email !== "" &&
        whatsapp !== "" &&
        latitude !== 0 &&
        longitude !== 0 &&
        city !== "" &&
        uf !== "" &&
        items !== ""
      ) {
        const trx = await knex.transaction();

        const point = {
          image: request.file.filename,
          name,
          email,
          whatsapp,
          latitude,
          longitude,
          city,
          uf,
        };

        const insertedIds = await trx("points").insert(point);

        const point_id = insertedIds[0];

        const pointItems = items
          .split(",")
          .map((item: String) => Number(item.trim()))
          .map((item_id: number) => {
            return {
              item_id,
              point_id,
            };
          });

        await trx("point_items").insert(pointItems);

        await trx.commit();

        const errorResult = {
          error: false,
          message: "Cadastro concluído!",
        };

        return response.json({
          ...errorResult,
          point: { id: point_id, ...point },
        });
      } else {
        const errorResult = {
          error: true,
          message: "Preencha todos os campos!",
        };

        return response.json(errorResult);
      }
    } catch {
      const errorResult = {
        error: true,
        message: "Oops... algo deu errado!",
      };

      return response.json(errorResult);
    }
  }
}

export default PointsController;
