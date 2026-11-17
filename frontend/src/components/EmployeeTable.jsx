
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material'
import api from '../services/api'

function EmployeeTable() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [countryId, setCountryId] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalEmployees, setTotalEmployees] = useState(0) 

  
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)

      try {
        const response = await api.get('/employees/', {
          params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: search || undefined,
          department_id: departmentId || undefined,
          country_id: countryId || undefined,
        },
        })

        setEmployees(response.data)
        const countResponse = await api.get('/employees/count', {
          params: {
            search: search || undefined,
            department_id: departmentId || undefined,
            country_id: countryId || undefined,
          },
        })

        setTotalEmployees(countResponse.data.total_employees)
      } catch (error) {
        console.error('Failed to load employees:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [search, departmentId, countryId, page, rowsPerPage])  


  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Employee Directory
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Search by name, employee ID or email"
          value={search}
          onChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }}
          sx={{ mb: 3 }}
        />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <FormControl fullWidth size="small">
          <InputLabel>Department</InputLabel>
          <Select
            value={departmentId}
            label="Department"
            onChange={(event) => {
              setDepartmentId(event.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All Departments</MenuItem>
            <MenuItem value={1}>Engineering</MenuItem>
            <MenuItem value={2}>HR</MenuItem>
            <MenuItem value={3}>Finance</MenuItem>
            <MenuItem value={4}>Sales</MenuItem>
            <MenuItem value={5}>Marketing</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Country</InputLabel>
          <Select
            value={countryId}
            label="Country"
            onChange={(event) => {
              setCountryId(event.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All Countries</MenuItem>
            <MenuItem value={1}>India</MenuItem>
            <MenuItem value={2}>USA</MenuItem>
            <MenuItem value={3}>UK</MenuItem>
            <MenuItem value={4}>Germany</MenuItem>
            <MenuItem value={5}>Canada</MenuItem>
          </Select>
        </FormControl>
      </div>


        {loading ? (
          <CircularProgress />
        ) : (
          <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.employee_code}</TableCell>
                    <TableCell>
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={employee.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            <TablePagination
              component="div"
              count={totalEmployees}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
            </>
        )}
      </CardContent>
    </Card>
  )
}

export default EmployeeTable
