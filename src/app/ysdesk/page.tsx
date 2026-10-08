import type { Metadata } from "next";
import YsdeskClient from "./ysdesk-client";
import "./styles.css";

export const metadata: Metadata = {
  title: "YSdesk | Licenças e dispositivos",
  description: "Gerencie os dispositivos e licenças do YSdesk.",
};

export default function YsdeskPage() {
  return <YsdeskClient />;
}