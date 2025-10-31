import { getFilteredApplications } from "@/lib/data/dashboard";
import { getCurrentUser } from "@/lib/auth/hooks";
import DashboardClientUI from "./DashboardClientUI";

interface Application {
  id: string;
  application_number: string;
  customer_name: string;
  phone_number: string;
  status: string;
  submitted_at: string;
  branch: {
    name: string;
  };
  product: {
    name: string;
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  console.log(user)
  const data = await getFilteredApplications(user?.role, user?.id);
  console.log(data)
  return (
    <div>
      <DashboardClientUI data={data} />
    </div>
  );
}
