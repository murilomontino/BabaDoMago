import { ErrorMessage } from "formik";
import { ERROR_CLASS } from "@/const/ui";

type FormErrorProps = {
	name: string;
};

export function FormError({ name }: FormErrorProps) {
	return <ErrorMessage name={name} component="p" className={ERROR_CLASS} />;
}
