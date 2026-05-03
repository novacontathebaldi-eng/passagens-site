import { changeReservationStatus } from "../src/app/actions/reservas";

async function test() {
  try {
    const res = await changeReservationStatus("some-uuid", "APPROVED");
    console.log(res);
  } catch (e) {
    console.error("Caught error:", e);
  }
}
test();
