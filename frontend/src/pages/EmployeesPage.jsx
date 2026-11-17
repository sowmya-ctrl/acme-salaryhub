import { useSearchParams } from 'react-router-dom'
import EmployeeTable from '../components/EmployeeTable'

/** Reads ?search= (top-bar search) and ?add=1 (dashboard quick action); remounts when they change. */
function EmployeesPage() {
  const [params] = useSearchParams()
  return (
    <EmployeeTable
      key={params.toString()}
      initialSearch={params.get('search') ?? ''}
      openAdd={params.get('add') === '1'}
    />
  )
}

export default EmployeesPage
