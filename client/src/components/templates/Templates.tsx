import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Mail, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const Templates = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates", { search: searchQuery }],
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (id: string) => {
    // In a real app, add a confirmation dialog
    deleteTemplate.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Email Templates</h1>
          <p className="text-neutral-600">Create and manage your email templates</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/templates/new">
            <Button className="bg-primary text-white px-4 py-2 rounded-md flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search templates..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templates?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: Template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="h-40 bg-white bg-opacity-10 flex items-center justify-center relative">
                <Mail className="h-16 w-16 text-primary opacity-30" />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/templates/${template.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-1">{template.name}</h3>
                <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{template.description}</p>
                <p className="text-neutral-500 text-xs">
                  Last updated: {formatDate(template.updatedAt)}
                </p>
                <div className="mt-4 flex justify-between">
                  <Link href={`/templates/${template.id}`}>
                    <Button variant="outline" size="sm">Preview</Button>
                  </Link>
                  <Link href={`/templates/${template.id}/edit`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm p-10">
          <Mail className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-neutral-600 mb-6">
            {searchQuery
              ? `No templates match "${searchQuery}"`
              : "You haven't created any templates yet"}
          </p>
          <Link href="/templates/new">
            <Button>Create Your First Template</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Templates;
