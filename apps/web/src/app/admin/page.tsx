/**
 * Admin 根路由：重定向至问卷列表。
 */
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/questionnaires');
}
