import type { ApiUser } from "../../../types";

export interface UserEditValues {
  name: string;
  password: string;
  role: ApiUser["role"];
  status: string;
  accessIds: string[];
}
