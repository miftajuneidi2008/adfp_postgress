import { getBranchName } from "@/lib/data/Branches";
import { getUsers } from "@/lib/data/users";
import UserUI, { Branch, User } from "./UserUI";

export default async function UsersPage() {
  const branch: Branch[] = await getBranchName();
  const activeUsers: User[] = await getUsers();

  return (
    <div>
      <UserUI activeUsers={activeUsers} branch={branch} />
    </div>
  );
}
