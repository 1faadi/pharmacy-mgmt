import UserForm from '@/components/forms/user-form'

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <UserForm />
        </div>
      </div>
    </div>
  )
}
