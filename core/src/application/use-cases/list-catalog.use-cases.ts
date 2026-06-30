import { type Result, ok, err, UnexpectedError } from "@haku/shared";
import type { CoreRepository } from "../ports/core-repository.port.js";
import type { Category, FoodType } from "../../domain/venue.js";

export async function listCategories(repo: CoreRepository): Promise<Result<Category[]>> {
  try {
    return ok(await repo.listCategories());
  } catch (cause) {
    return err(new UnexpectedError("No se pudieron listar las categorías", cause));
  }
}

export async function listFoodTypes(repo: CoreRepository): Promise<Result<FoodType[]>> {
  try {
    return ok(await repo.listFoodTypes());
  } catch (cause) {
    return err(new UnexpectedError("No se pudieron listar los tipos de comida", cause));
  }
}
