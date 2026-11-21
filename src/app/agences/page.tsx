import type { Metadata } from "next";
import { AgencesBoard } from "@/components/leads/agences-board";

export const metadata: Metadata = {
  title: "Agences de voyage",
  description: "Agences de voyage à Kinshasa et Lubumbashi, classées par province et par commune.",
};

export default function AgencesPage() {
  return <AgencesBoard />;
}
