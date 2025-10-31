import { getApplications } from "@/lib/data/Application"
import ApplicationUi from "./ApplicationUi"
import { getFilteredApplications } from "@/lib/data/dashboard"
import { getCurrentUser } from "@/lib/auth/hooks";

export default async function ApplicationsPage() {
  const application = await getApplications()
       const user = await getCurrentUser();
       
      const data =await  getFilteredApplications(user?.role, user?.id)

  return(
    <div>
     <ApplicationUi application={application} profile= {user}/>
    
    </div>
  )
}
