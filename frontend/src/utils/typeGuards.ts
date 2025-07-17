import type { Human } from "../entities/Human";
import type { Location } from "../entities/Location";
// import type { Work } from "../entities/Work";
// import type { Event } from "../entities/Event";

export function isHuman(obj: any): obj is Human {
  return (
    obj &&
    typeof obj === "object" &&
    "birth_date" in obj &&
    "death_date" in obj
  );
}

export function isLocation(obj: any): obj is Location {
  return (
    obj &&
    typeof obj === "object" &&
    "loc_lat" in obj &&
    "loc_lon" in obj
  );
}

// export function isWork(obj: any): obj is Work {
//   return (
//     obj &&
//     typeof obj === "object" &&
//     "title" in obj &&
//     "date" in obj
//   );
// }

// export function isEvent(obj: any): obj is Event {
//   return (
//     obj &&
//     typeof obj === "object" &&
//     "start_date" in obj &&
//     "event_type" in obj
//   );
// }
