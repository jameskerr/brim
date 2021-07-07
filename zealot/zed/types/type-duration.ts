import {Duration} from "../values/duration"
import {BasePrimitive} from "./base-primitive"

class TypeOfDuration extends BasePrimitive<Duration> {
  name = "duration"

  create(value: string) {
    return new Duration(value)
  }
}

export const TypeDuration = new TypeOfDuration()
