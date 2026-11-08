import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SECTION_IDS, SECTIONS } from "@/lib/sections"

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Choose a test</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_IDS.map((id) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle>{SECTIONS[id].name}</CardTitle>
              <CardDescription>{SECTIONS[id].summary}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href={`/${id}`}>{SECTIONS[id].name} tests</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
