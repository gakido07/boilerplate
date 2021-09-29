import * as React from "react"
import { CgSoftwareDownload, CgUserAdd } from "react-icons/cg"
import { gql } from "@apollo/client"
import { Box, Button, Center, Checkbox, Heading, HStack, Spinner, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import Head from "next/head"

import { paginate } from "lib/apollo/helpers"
import { QueryMode, Role, SortOrder, useGetUsersQuery, UserItemFragment } from "lib/graphql"
import { AdminLayout } from "components/AdminLayout"
import { PartialCheckIcon } from "components/PartialCheckIcon"
import { Search } from "components/Search"
import { Column, Table } from "components/Table"

const _ = gql`
  fragment UserItem on User {
    id
    fullName
    email
    updatedAt
  }
`

const __ = gql`
  query GetUsers($take: Int, $orderBy: [UserOrderByWithRelationInput!], $where: UserWhereInput, $skip: Int) {
    users(take: $take, orderBy: $orderBy, where: $where, skip: $skip) {
      items {
        ...UserItem
      }
      count
    }
  }
`

const TAKE = 10
export default function Users() {
  const [search, setSearch] = React.useState("")
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])

  const { data, loading, fetchMore } = useGetUsersQuery({
    variables: {
      orderBy: { updatedAt: SortOrder.Desc },
      take: TAKE,
      where: {
        role: { equals: Role.User },
        OR: [
          { email: { contains: search, mode: QueryMode.Insensitive } },
          { firstName: { contains: search, mode: QueryMode.Insensitive } },
          { lastName: { contains: search, mode: QueryMode.Insensitive } },
        ],
      },
    },
  })

  const users = data?.users.items

  const handleFetchMore = () => {
    if (!users) return
    return fetchMore({
      variables: { skip: users.length, take: TAKE },
      updateQuery: paginate("users"),
    })
  }

  const toggleSelected = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers((selected) => selected.filter((d) => d !== userId))
    } else {
      setSelectedUsers((selected) => [...selected, userId])
    }
  }
  const toggleAll = () => {
    if (selectedUsers.length > 0) {
      setSelectedUsers([])
    } else if (users) {
      setSelectedUsers(users.map((user) => user.id))
    }
  }

  const isPartialSelection = !!users && selectedUsers.length > 0 && selectedUsers.length < users.length

  return (
    <Box>
      <Head>
        <title>Users</title>
      </Head>
      <Heading mb={2} fontWeight={800}>
        Users
      </Heading>
      <HStack mb={4}>
        <Search search={search} onSearch={setSearch} placeholder="Search users" />
        <Button
          display={{ base: "none", md: "flex" }}
          leftIcon={<Box boxSize="20px" as={CgSoftwareDownload} />}
        >
          Download
        </Button>
        <Button
          display={{ base: "none", md: "flex" }}
          colorScheme="purple"
          leftIcon={<Box boxSize="18px" as={CgUserAdd} />}
        >
          Create user
        </Button>
        {selectedUsers.length > 0 && <Button variant="ghost">{selectedUsers.length} selected</Button>}
      </HStack>
      {loading ? (
        <Center h={300}>
          <Spinner />
        </Center>
      ) : !!!users ? (
        <Center h={300}>
          <Text>Error getting users</Text>
        </Center>
      ) : (
        <Table
          noDataText="No users found"
          data={users}
          take={TAKE}
          onFetchMore={handleFetchMore}
          count={data?.users.count}
          isLoading={loading && !!!data}
        >
          <Column<UserItemFragment>
            display={{ base: "none", md: "flex" }}
            maxW="30px"
            header={
              <Checkbox
                colorScheme="purple"
                isChecked={data && data.users.count > 0 && selectedUsers.length > 0}
                onChange={toggleAll}
                iconColor="white"
                {...(isPartialSelection && { icon: <PartialCheckIcon color="white" /> })}
              />
            }
            row={(user) => (
              <Checkbox
                colorScheme="purple"
                isChecked={selectedUsers.includes(user.id)}
                iconColor="white"
                onChange={() => toggleSelected(user.id)}
              />
            )}
          />
          <Column<UserItemFragment> header="Name" row={(user) => user.fullName} />
          <Column<UserItemFragment>
            display={{ base: "none", md: "flex" }}
            header="Email"
            row={(user) => user.email}
          />
          <Column<UserItemFragment>
            header="Last updated"
            row={(user) => dayjs(user.updatedAt).format("DD/MM/YYYY")}
          />
        </Table>
      )}
    </Box>
  )
}

Users.getLayout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>
