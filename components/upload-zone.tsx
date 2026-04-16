'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ScanFilters } from '@/types/report'

interface UploadZoneProps {
  onSubmit: (file: File, filters: ScanFilters) => void
  isSubmitting: boolean
}

export function UploadZone({ onSubmit, isSubmitting }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [filters, setFilters] = useState<ScanFilters>({
    ignoreReferences: false,
    ignoreQuotes: false,
    minCopiedWords: 5,
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (isValidFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }, [])

  const isValidFile = (f: File): boolean => {
    const validTypes = ['.pdf', '.docx', '.txt']
    return validTypes.some(type => f.name.toLowerCase().endsWith(type))
  }

  const removeFile = () => {
    setFile(null)
  }

  const handleSubmit = () => {
    if (file) {
      onSubmit(file, filters)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop your file here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, DOCX, or TXT up to 10MB
                </p>
                <div className="relative">
                  <Button variant="secondary" disabled={isSubmitting}>
                    Browse Files
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.docx,.txt"
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Scan Settings</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ignore-refs">Ignore references</Label>
            <Switch
              id="ignore-refs"
              checked={filters.ignoreReferences}
              onCheckedChange={(checked) =>
                setFilters({ ...filters, ignoreReferences: checked })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ignore-quotes">Ignore quotes</Label>
            <Switch
              id="ignore-quotes"
              checked={filters.ignoreQuotes}
              onCheckedChange={(checked) =>
                setFilters({ ...filters, ignoreQuotes: checked })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="min-words">
              Minimum match length: {filters.minCopiedWords} words
            </Label>
            <Slider
              id="min-words"
              min={1}
              max={20}
              step={1}
              value={[filters.minCopiedWords]}
              onValueChange={(value) =>
                setFilters({ ...filters, minCopiedWords: Array.isArray(value) ? value[0] : value })
              }
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!file || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Check Plagiarism'}
      </Button>
    </div>
  )
}