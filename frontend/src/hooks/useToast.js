import { useContext } from "react";
import ToastContext from "../components/toast/ToastContext";

export default function useToast() {
  return useContext(ToastContext);
}
