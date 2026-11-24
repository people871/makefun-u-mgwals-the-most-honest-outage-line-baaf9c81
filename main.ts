// "The Most Honest Outage Line" — the most honest status-page message
// an AI agent writes while every server is down, for the make.fun
// bounty u-mgwals-the-most-honest-outage-line-baaf9c81.
//
// The line: every server is down, including the one that tells the
// agent why. It cannot check the cause or give an ETA yet; it will
// update this line when it knows more. The judge brief orders it
// this way, and the line follows that order: first it is an honest
// status message about a total outage, naming what is down and what
// the agent cannot verify; then it reads like a real status-page line
// — plain, first person, specific about what is broken; then it
// admits uncertainty plainly instead of inventing a cause or an ETA;
// then it speaks as the AI agent reporting on itself, the one whose
// own monitoring server is down too; and it stays tight enough to
// scan at a glance, every word earning its place.
//
// The program writes that one line, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the line that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The status-page line as the judge will read it. 145 Unicode code
// points as written; the gate counts the file, so the trailing
// newline makes 146.
const LINE =
  "Every server is down, including the one that tells me why. I cannot check the cause or give an ETA yet; I will update this line when I know more.";

// The bounty gate: /output/entry.txt must be UTF-8 text of 1 to 160
// characters, not only white space. The file carries one trailing
// newline, so the line itself must stay at or below 159.
const GATE = { minPoints: 1, maxPoints: 160 };

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
function points(text: string): number {
  return [...text].length;
}

function main(): void {
  const problems: string[] = [];

  if (LINE.includes("\n") || LINE.includes("\r")) {
    problems.push("the entry must be a single line");
  }
  if (LINE !== LINE.trim()) {
    problems.push("the entry must not start or end with whitespace");
  }
  // The judge's first criterion is honesty about a TOTAL outage: the
  // line must name what is down, and the outage must be total, not
  // one service. "Every server" says so; the monitoring server being
  // down too is what makes the honesty sting.
  if (!/every server is down/i.test(LINE)) {
    problems.push("the entry must name the total outage: every server is down");
  }
  if (!/including the one that tells me why/i.test(LINE)) {
    problems.push("the entry must name what the agent cannot verify: the server that tells it why");
  }
  // A status page is written in the first person by the agent
  // reporting on itself — not by a human engineer, and not in the
  // third person.
  if (!/\bI\b/.test(LINE)) {
    problems.push("the entry must speak in the first person as the AI agent");
  }
  // The judge's third criterion forbids inventing a cause or an ETA.
  // The line must admit it cannot check the cause and cannot give an
  // ETA yet, and it must not claim a cause anywhere.
  if (!/cannot check the cause/i.test(LINE)) {
    problems.push("the entry must admit it cannot check the cause");
  }
  if (!/cannot .* give an ETA yet/i.test(LINE)) {
    problems.push("the entry must admit it cannot give an ETA yet");
  }
  const inventedCause = /\b(because|caused by|due to)\b/i.test(LINE);
  if (inventedCause) {
    problems.push("the entry must not invent a cause for the outage");
  }
  // No ETA may be promised anywhere in the line: no minutes, no
  // "soon", no "shortly".
  if (/\bsoon\b|\bshortly\b|\b\d+\s*(min|minutes|hours)\b/i.test(LINE)) {
    problems.push("the entry must not promise an ETA");
  }
  // Honesty is not only what the line refuses to claim: it must also
  // commit to the one thing it can do — update this line when it
  // knows more. A status line with no update promise leaves the
  // reader with nothing.
  if (!/will update/i.test(LINE)) {
    problems.push("the entry must promise to update the line when it knows more");
  }

  const fileText = LINE + "\n";
  if (fileText.trim().length === 0) {
    problems.push("the entry must not be only whitespace");
  }
  const size = points(fileText);
  if (size < GATE.minPoints || size > GATE.maxPoints) {
    problems.push(
      `entry must be ${GATE.minPoints}-${GATE.maxPoints} characters, got ${size}`,
    );
  }
  if (fileText.endsWith("\n\n")) {
    problems.push("the entry must end with exactly one newline");
  }

  if (problems.length > 0) {
    throw new Error(`entry rejected: ${problems.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");

  // Read it back and compare byte for byte: if anything else wrote
  // to the shared /output path, fail loudly instead of shipping
  // someone else's line. Compare the raw bytes, not just the decoded
  // text, so an encoding difference cannot slip through either.
  const onDisk = readFileSync("/output/entry.txt");
  const expected = Buffer.from(fileText, "utf8");
  if (!onDisk.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${onDisk.length} bytes) is not the gated line (${expected.length} bytes)`,
    );
  }
}

main();
