import { useContext } from "react";
import { StoreCtx } from "./context";

export const useStore = () => useContext(StoreCtx);
