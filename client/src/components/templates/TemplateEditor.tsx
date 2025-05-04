import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Eye, Save } from "lucide-react";

// Define template elements for drag-and-drop functionality
const templateElements = [
  { id: "heading", label: "Heading", icon: "title" },
  { id: "text", label: "Text Block", icon: "text_fields" },
  { id: "image", label: "Image", icon: "image" },
  { id: "button", label: "Button", icon: "smart_button" },
  { id: "divider", label: "Divider", icon: "space_bar" },
  { id: "2columns", label: "2 Columns", icon: "view_column" },
];

// Style options
const backgroundColors = ["#FFFFFF", "#F7F9FC", "#4A6FFF", "#FF6B4A", "#1E293B"];
const fontOptions = ["Arial", "Helvetica", "Georgia", "Times New Roman"];
const textColors = ["#1E293B", "#475569", "#4A6FFF", "#FFFFFF"];

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Template content is required"),
  backgroundColor: z.string(),
  font: z.string(),
  textColor: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const TemplateEditor = () => {
  const [params] = useParams();
  const { id } = params;
  const isEditing = !!id;
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [content, setContent] = useState("<div></div>");
  
  const { data: template, isLoading } = useQuery({
    queryKey: [`/api/templates/${id}`],
    enabled: isEditing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "<div></div>",
      backgroundColor: "#FFFFFF",
      font: "Arial",
      textColor: "#1E293B",
    },
  });

  // Set form values when template data is loaded
  React.useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        content: template.content,
        backgroundColor: template.backgroundColor || "#FFFFFF",
        font: template.font || "Arial",
        textColor: template.textColor || "#1E293B",
      });
      setContent(template.content);
    }
  }, [template, form]);

  const saveTemplate = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/templates/${id}`, values);
      } else {
        return apiRequest("POST", "/api/templates", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: isEditing ? "Template updated" : "Template created",
        description: isEditing
          ? "Your template has been updated successfully"
          : "Your template has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Update content with the current editor content
    values.content = content;
    saveTemplate.mutate(values);
  };

  // Simulate adding an element to the editor
  const addElement = (elementType: string) => {
    let newElement = "";
    
    switch (elementType) {
      case "heading":
        newElement = `<h2 class="text-lg font-semibold text-neutral-800 mb-4">Heading Text</h2>`;
        break;
      case "text":
        newElement = `<p class="text-neutral-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit, vulputate eu pharetra nec, mattis ac neque.</p>`;
        break;
      case "image":
        newElement = `<div class="mb-6">
          <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
               alt="A laptop on a desk with a coffee cup" 
               class="w-full h-48 object-cover rounded-md mb-2">
          <p class="text-xs text-neutral-500 text-center">Image caption</p>
        </div>`;
        break;
      case "button":
        newElement = `<div class="text-center mb-6">
          <a href="#" class="inline-block px-6 py-2 bg-secondary text-white rounded-md">Click Here</a>
        </div>`;
        break;
      case "divider":
        newElement = `<hr class="my-6 border-neutral-200">`;
        break;
      case "2columns":
        newElement = `<div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1 p-4 border border-neutral-200 rounded">
            <p class="text-neutral-600">Left column content</p>
          </div>
          <div class="flex-1 p-4 border border-neutral-200 rounded">
            <p class="text-neutral-600">Right column content</p>
          </div>
        </div>`;
        break;
      default:
        return;
    }
    
    // In a real implementation, this would use a proper WYSIWYG editor
    // For this demo, we'll just append the new element
    setContent(prev => prev.replace("</div>", newElement + "</div>"));
  };

  // Preview rendering function
  const renderPreview = () => {
    const styles = {
      backgroundColor: form.watch("backgroundColor") || "#FFFFFF",
      fontFamily: form.watch("font") || "Arial",
      color: form.watch("textColor") || "#1E293B",
    };
    
    return (
      <div className="max-w-xl mx-auto bg-white shadow-sm rounded-md" style={{ minHeight: "800px" }}>
        {/* Sample preview - in a real application, this would render the actual template */}
        <div className="p-4 bg-primary text-white text-center">
          <h1 className="text-xl font-bold">Email Template Preview</h1>
          <p>{form.watch("name")}</p>
        </div>
        
        <div className="p-6" style={styles} dangerouslySetInnerHTML={{ __html: content }} />
        
        <div className="p-4 bg-neutral-100 text-neutral-600 text-center text-sm">
          <p>© 2023 Your Company Name. All rights reserved.</p>
          <p className="mt-2">
            <a href="#" className="text-primary hover:underline">Unsubscribe</a> | 
            <a href="#" className="text-primary hover:underline">View in browser</a> | 
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    );
  };

  if (isLoading && isEditing) {
    return <div className="p-6 text-center">Loading template...</div>;
  }

  return (
    <div>
      <div className="bg-white border-b border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/templates">
              <Button variant="ghost" size="icon" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-lg font-semibold text-neutral-800">
              {isEditing ? `Edit Template: ${template?.name}` : "Create New Template"}
            </h2>
          </div>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preview Template</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Button type="submit" disabled={saveTemplate.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-64px)]">
        {!previewMode ? (
          <>
            {/* Toolbar */}
            <div className="w-64 border-r border-neutral-100 bg-white p-4">
              <div className="mb-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Template" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Template description" 
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-800 mb-3">Elements</h3>
                <div className="space-y-2">
                  {templateElements.map((element) => (
                    <div 
                      key={element.id}
                      className="p-2 border border-neutral-200 rounded bg-neutral-50 flex items-center cursor-pointer hover:border-primary"
                      onClick={() => addElement(element.id)}
                    >
                      <span className="material-icons text-neutral-600 mr-2">{element.icon}</span>
                      <span className="text-sm">{element.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-800 mb-3">Style</h3>
                <div className="space-y-4">
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-neutral-600 block mb-1">Background Color</FormLabel>
                            <div className="flex space-x-2">
                              {backgroundColors.map((color) => (
                                <div
                                  key={color}
                                  className={`w-6 h-6 rounded-full cursor-pointer ${
                                    field.value === color ? 'ring-2 ring-primary' : ''
                                  }`}
                                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #E1E7EF' : 'none' }}
                                  onClick={() => form.setValue('backgroundColor', color)}
                                />
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="font"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-neutral-600 block mb-1">Font</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fontOptions.map((font) => (
                                  <SelectItem key={font} value={font}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-neutral-600 block mb-1">Text Color</FormLabel>
                            <div className="flex space-x-2">
                              {textColors.map((color) => (
                                <div
                                  key={color}
                                  className={`w-6 h-6 rounded-full cursor-pointer ${
                                    field.value === color ? 'ring-2 ring-primary' : ''
                                  }`}
                                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #E1E7EF' : 'none' }}
                                  onClick={() => form.setValue('textColor', color)}
                                />
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
            </div>
            
            {/* Editor Canvas */}
            <div className="flex-1 bg-neutral-100 p-8 overflow-y-auto">
              <div 
                className="max-w-xl mx-auto bg-white shadow-sm rounded-md" 
                style={{ minHeight: "800px" }}
              >
                {/* In a real application, this would be an interactive editor with WYSIWYG capabilities */}
                {/* For this demo, we'll use a simulated editor */}
                <div className="p-4 bg-primary text-white text-center">
                  <h1 className="text-xl font-bold">
                    {form.watch("name") || "Monthly Newsletter"}
                  </h1>
                  <p>July 2023 Edition</p>
                </div>
                
                <div 
                  className="p-6"
                  style={{
                    backgroundColor: form.watch("backgroundColor"),
                    fontFamily: form.watch("font"),
                    color: form.watch("textColor"),
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                
                <div className="p-4 bg-neutral-100 text-neutral-600 text-center text-sm">
                  <p>© 2023 Your Company Name. All rights reserved.</p>
                  <p className="mt-2">
                    <a href="#" className="text-primary hover:underline">Unsubscribe</a> | 
                    <a href="#" className="text-primary hover:underline">View in browser</a> | 
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-neutral-100 p-8 overflow-y-auto">
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;
