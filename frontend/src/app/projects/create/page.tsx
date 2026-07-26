import { redirect } from 'next/navigation';

/** Plan alias: /projects/create → SME post-project form */
export default function ProjectsCreatePage() {
  redirect('/sme/post-project');
}
