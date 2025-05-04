import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddContactModal from "./AddContactModal";
import ImportContactsModal from "./ImportContactsModal";
import { formatDate } from "@/lib/utils";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState("all_lists");
  const [selectedStatus, setSelectedStatus] = useState("all_statuses");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts", { search: searchQuery, list: selectedList, status: selectedStatus, page: currentPage }],
  });

  const { data: contactLists } = useQuery({
    queryKey: ["/api/contactLists"],
  });

  const totalPages = contacts?.totalPages || 1;
  const contactsData = contacts?.data || [];
  const totalContacts = contacts?.total || 0;

  const handleSelectAllContacts = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contactsData.map((contact: any) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, id]);
    } else {
      setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "unsubscribed":
        return "bg-error/10 text-error";
      case "bounced":
        return "bg-warning/10 text-warning";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Contact Management</h1>
          <p className="text-neutral-600">Manage your subscriber lists and segments</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Contacts
          </Button>
          <Button 
            className="bg-primary text-white flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search contacts..."
              className="border-none focus:ring-0 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <Select
              value={selectedList}
              onValueChange={setSelectedList}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Lists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_lists">All Lists</SelectItem>
                {contactLists?.map((list: any) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] px-6 py-3">
                  <Checkbox 
                    checked={contactsData.length > 0 && selectedContacts.length === contactsData.length}
                    onCheckedChange={handleSelectAllContacts}
                  />
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Email</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Lists</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Date Added</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading contacts...</TableCell>
                </TableRow>
              ) : contactsData.length > 0 ? (
                contactsData.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleSelectContact(contact.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-800">{contact.email}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-800">{contact.name || "-"}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {contact.lists?.map((list: any) => (
                          <Badge 
                            key={list.id} 
                            variant="outline"
                            className="px-2 py-0.5 text-xs bg-primary bg-opacity-10 text-primary rounded"
                          >
                            {list.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={getStatusBadgeClass(contact.status)}>
                        {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-neutral-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                          <DropdownMenuItem>View Activity</DropdownMenuItem>
                          <DropdownMenuItem className="text-error">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">No contacts found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">
              {contactsData.length > 0 
                ? `Showing ${(currentPage - 1) * 10 + 1}-${Math.min((currentPage) * 10, totalContacts)} of ${totalContacts} contacts` 
                : "No contacts found"}
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                
                if (totalPages > 3) {
                  if (currentPage > 2) {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  if (pageNum > totalPages) {
                    pageNum = totalPages - (2 - i);
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Contact Lists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactLists?.map((list: any) => (
            <div key={list.id} className="border border-neutral-200 rounded-md p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium text-neutral-800">{list.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{list.contactCount} contacts</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-neutral-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit List</DropdownMenuItem>
                    <DropdownMenuItem>Export Contacts</DropdownMenuItem>
                    <DropdownMenuItem className="text-error">Delete List</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center">
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success" 
                    style={{ width: `${list.activePercentage}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-neutral-600">{list.activePercentage}% active</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AddContactModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />
      
      <ImportContactsModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
      />
    </div>
  );
};

export default Contacts;
