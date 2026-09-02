import { OpsDossierView } from "@/components/ops-dossier";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OpsDossierPage({ params }: Props) {
  const { id } = await params;
  return <OpsDossierView id={id} />;
}
