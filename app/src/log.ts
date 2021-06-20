import dateFormat from "dateformat";

export default function log(msg: string): void {
	const now: string = dateFormat(new Date(), "dd/mm/yyyy HH:MM:ss");
	console.log(`${now} | ${msg}`);
}