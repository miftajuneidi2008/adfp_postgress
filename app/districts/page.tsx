import { getBranch } from "@/lib/data/Branches";
import { getDistrict } from "@/lib/data/District";
import DistrictUI from "./DistrictUI";

interface District {
  id: string;
  name: string;
  code: string | null;
}

interface Branch {
  id: string;
  name: string;
  code: string | null;
  district_id: string;
  district?: District;
}

export default async function DistrictsPage() {
  const district = await getDistrict();

  const branch = await getBranch();

  return <DistrictUI branch={branch} district={district} />;
}
