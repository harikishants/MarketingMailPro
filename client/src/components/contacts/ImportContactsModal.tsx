import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const fileImportSchema = z.object({
  file: z.instanceof(File).refine(file => {
    return file.size < 10 * 1024 * 1024; // 10MB
  }, "File size should be less than 10MB"),
  listId: z.string().min(1, "Please select a list"),
});

const csvImportSchema = z.object({
  csv: z.string().min(1, "Please paste CSV content"),
  listId: z.string().min(1, "Please select a list"),
});

type FileImportValues = z.infer<typeof fileImportSchema>;
type CSVImportValues = z.infer<typeof csvImportSchema>;

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportContactsModal = ({ open, onOpenChange }: ImportContactsModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("file");
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  
  const fileForm = useForm<FileImportValues>({
    resolver: zodResolver(fileImportSchema),
    defaultValues: {
      listId: "",
    },
  });
  
  const csvForm = useForm<CSVImportValues>({
    resolver: zodResolver(csvImportSchema),
    defaultValues: {
      csv: "",
      listId: "",
    },
  });

  const { data: contactLists } = useQuery({
    queryKey: ["/api/contactLists"],
    enabled: open,
  });
  
  const importContacts = useMutation({
    mutationFn: async (values: FileImportValues | CSVImportValues & { type: string }) => {
      setImportProgress(0);
      setImportStatus("processing");
      
      const formData = new FormData();
      if (values.type === "file" && "file" in values) {
        formData.append("file", values.file);
      } else if (values.type === "csv" && "csv" in values) {
        formData.append("csv", values.csv);
      }
      formData.append("listId", values.listId);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      try {
        const response = await fetch("/api/contacts/import", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          setImportStatus("error");
          setImportProgress(0);
          throw new Error(`Import failed: ${response.statusText}`);
        }
        
        setImportProgress(100);
        setImportStatus("success");
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setImportStatus("error");
        setImportProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contactLists"] });
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${data.imported} contacts. ${data.duplicates || 0} duplicates were skipped.`,
      });
      
      // Reset after success
      setTimeout(() => {
        fileForm.reset();
        csvForm.reset();
        setImportStatus("idle");
        setImportProgress(0);
        onOpenChange(false);
      }, 2000);
    },
    onError: (error) => {
      setImportStatus("error");
      toast({
        title: "Import failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onFileSubmit = (values: FileImportValues) => {
    importContacts.mutate({ ...values, type: "file" });
  };

  const onCSVSubmit = (values: CSVImportValues) => {
    importContacts.mutate({ ...values, type: "csv" });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      fileForm.setValue("file", file);
    }
  };

  const resetModal = () => {
    fileForm.reset();
    csvForm.reset();
    setImportStatus("idle");
    setImportProgress(0);
    setActiveTab("file");
  };
  
  // Show different content based on import status
  if (importStatus === "success") {
    return (
      <Dialog open={open} onOpenChange={(state) => {
        if (!state) resetModal();
        onOpenChange(state);
      }}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Import Successful</h2>
            <p className="text-neutral-600 mb-6">
              Your contacts have been successfully imported.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (importStatus === "processing") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Importing Contacts</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Progress value={importProgress} className="mb-4" />
            <p className="text-center text-neutral-600">
              Please wait while we import your contacts...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(state) => {
      if (!state) resetModal();
      onOpenChange(state);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Import Contacts</DialogTitle>
        </DialogHeader>
        
        {importStatus === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error importing your contacts. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="csv">Paste CSV</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file">
            <Form {...fileForm}>
              <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-6">
                <FormField
                  control={fileForm.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Upload CSV File</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                          <Upload className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                          <p className="text-sm text-neutral-600 mb-2">
                            Drag & drop a CSV file here, or click to browse
                          </p>
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                            {...fieldProps}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            Select File
                          </Button>
                          {fileForm.watch("file") && (
                            <p className="mt-2 text-sm text-neutral-600">
                              Selected: {fileForm.watch("file").name}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={fileForm.control}
                  name="listId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add to List</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactLists?.map((list: any) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={importContacts.isPending}>
                    Import Contacts
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="csv">
            <Form {...csvForm}>
              <form onSubmit={csvForm.handleSubmit(onCSVSubmit)} className="space-y-6">
                <FormField
                  control={csvForm.control}
                  name="csv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste CSV Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="email,name,custom_field
john@example.com,John Doe,Value1
jane@example.com,Jane Smith,Value2"
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={csvForm.control}
                  name="listId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add to List</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactLists?.map((list: any) => (
                              <SelectItem key={list.id} value={list.id}>
                                {list.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={importContacts.isPending}>
                    Import Contacts
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportContactsModal;
