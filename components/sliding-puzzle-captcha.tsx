"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, RotateCcw, Clock, Upload, Lightbulb, XCircle } from "lucide-react"

interface Coordinates {
  x: number
  y: number
}

class Puzzle {
  constructor(
    public value: number,
    public x: number,
    public y: number,
  ) {}

  updatePosition(newCoordinates: Coordinates): void {
    this.x = newCoordinates.x
    this.y = newCoordinates.y
  }
}

// Utility functions
function getColumnNumber(index: number | string, gridSize: number): number {
  return +index % gridSize
}

function getRowNumber(index: number | string, gridSize: number): number {
  return Math.floor(+index / gridSize)
}

class Board {
  gameState: Puzzle[] = []
  emptyFieldIndex!: number

  constructor(
    public gridSize = 3,
    gameStateToLoad?: Puzzle[],
  ) {
    if (gameStateToLoad) {
      this.gameState = gameStateToLoad.map((puzzle) => new Puzzle(puzzle.value, puzzle.x, puzzle.y))
      this.emptyFieldIndex = this.gameState.findIndex((puzzle) => puzzle.value === 0)
      return
    }
    this.generatePuzzles()
    this.shuffleBoard()
  }

  shuffleBoard(numberOfShuffles = 15 * this.gridSize * this.gridSize): void {
    for (let i = 0; i < numberOfShuffles; i++) {
      const options = this.getPossibleMoves()
      const randomMove = Math.floor(Math.random() * options.length)
      this.swapPuzzle(this.emptyFieldIndex, options[randomMove])
      this.emptyFieldIndex = options[randomMove]
    }
  }

  getPossibleMoves(): number[] {
    const emptyRow = getRowNumber(this.emptyFieldIndex, this.gridSize)
    const emptyColumn = getColumnNumber(this.emptyFieldIndex, this.gridSize)
    const options = []

    if (getRowNumber(this.emptyFieldIndex - 1, this.gridSize) === emptyRow) options.push(this.emptyFieldIndex - 1)
    if (getRowNumber(this.emptyFieldIndex + 1, this.gridSize) === emptyRow) options.push(this.emptyFieldIndex + 1)
    if (
      this.emptyFieldIndex + this.gridSize < this.gridSize * this.gridSize &&
      getColumnNumber(this.emptyFieldIndex + this.gridSize, this.gridSize) === emptyColumn
    )
      options.push(this.emptyFieldIndex + this.gridSize)
    if (
      this.emptyFieldIndex - this.gridSize >= 0 &&
      getColumnNumber(this.emptyFieldIndex - this.gridSize, this.gridSize) === emptyColumn
    )
      options.push(this.emptyFieldIndex - this.gridSize)

    return options
  }

  generatePuzzles(): void {
    for (let i = 1; i < this.gridSize * this.gridSize; i++) {
      const row = getRowNumber(i - 1, this.gridSize)
      const column = getColumnNumber(i - 1, this.gridSize)
      const newPuzzle = new Puzzle(i, row, column)
      this.gameState.push(newPuzzle)
    }
    const newPuzzle = new Puzzle(0, this.gridSize - 1, this.gridSize - 1)
    this.gameState.push(newPuzzle)
    this.emptyFieldIndex = this.gridSize * this.gridSize - 1
  }

  makeMove(index: number): void {
    if (this.isMovePossible(index)) {
      this.swapPuzzle(this.emptyFieldIndex, index)
      this.emptyFieldIndex = index
    }
  }

  isMovePossible(index: number): boolean {
    const possibleOptions = this.getPossibleMoves()
    return possibleOptions.includes(index)
  }

  swapPuzzle(index1: number, index2: number): void {
    const tempPuzzle = this.gameState[index1]
    this.gameState[index1] = this.gameState[index2]
    this.gameState[index2] = tempPuzzle

    this.gameState[index1].updatePosition({
      x: getRowNumber(index1, this.gridSize),
      y: getColumnNumber(index1, this.gridSize),
    })
    this.gameState[index2].updatePosition({
      x: getRowNumber(index2, this.gridSize),
      y: getColumnNumber(index2, this.gridSize),
    })
  }

  isSolved(): boolean {
    return this.gameState.every((puzzle, index) => {
      const expectedValue = index === this.gridSize * this.gridSize - 1 ? 0 : index + 1
      return puzzle.value === expectedValue
    })
  }

  clone(): Board {
    return new Board(this.gridSize, this.gameState)
  }
}

// Simple A* solver implementation
function solvePuzzle(board: Board): number[] {
  const gridSize = board.gridSize

  // Manhattan distance heuristic
  const calculateHeuristic = (gameState: Puzzle[]): number => {
    let distance = 0
    for (let i = 0; i < gameState.length; i++) {
      const puzzle = gameState[i]
      if (puzzle.value === 0) continue

      const targetIndex = puzzle.value - 1
      const targetRow = getRowNumber(targetIndex, gridSize)
      const targetCol = getColumnNumber(targetIndex, gridSize)

      distance += Math.abs(puzzle.x - targetRow) + Math.abs(puzzle.y - targetCol)
    }
    return distance
  }

  interface Node {
    board: Board
    path: number[]
    cost: number
    heuristic: number
  }

  const openSet: Node[] = []
  const closedSet = new Set<string>()

  const getStateString = (gameState: Puzzle[]): string => {
    return gameState.map((p) => `${p.value}-${p.x}-${p.y}`).join("|")
  }

  const startNode: Node = {
    board: board.clone(),
    path: [],
    cost: 0,
    heuristic: calculateHeuristic(board.gameState),
  }

  openSet.push(startNode)

  while (openSet.length > 0) {
    // Find node with lowest f-score (cost + heuristic)
    openSet.sort((a, b) => a.cost + a.heuristic - (b.cost + b.heuristic))
    const current = openSet.shift()!

    const stateString = getStateString(current.board.gameState)
    if (closedSet.has(stateString)) continue
    closedSet.add(stateString)

    // Check if solved
    if (current.board.isSolved()) {
      return current.path
    }

    // Limit search depth to prevent infinite loops
    if (current.path.length > 50) continue

    // Generate neighbors
    const possibleMoves = current.board.getPossibleMoves()

    for (const moveIndex of possibleMoves) {
      const newBoard = current.board.clone()
      newBoard.makeMove(moveIndex)

      const newStateString = getStateString(newBoard.gameState)
      if (closedSet.has(newStateString)) continue

      const newNode: Node = {
        board: newBoard,
        path: [...current.path, moveIndex],
        cost: current.cost + 1,
        heuristic: calculateHeuristic(newBoard.gameState),
      }

      openSet.push(newNode)
    }
  }

  return [] // No solution found
}

// Animated dots component
function AnimatedDots() {
  const [dotCount, setDotCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return <span>{".".repeat(dotCount)}</span>
}

interface SlidingPuzzleCaptchaProps {
  imageUrl?: string
  onVerificationComplete?: () => void
  difficulty?: "easy" | "medium" | "hard"
  boardSize?: number
}

export default function SlidingPuzzleCaptcha({
  imageUrl = "/puzzle-image.jpeg",
  onVerificationComplete,
  difficulty = "medium",
  boardSize = 300,
}: SlidingPuzzleCaptchaProps) {
  const [board, setBoard] = useState<Board | null>(null)
  const [moves, setMoves] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isVerified, setIsVerified] = useState(false)
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [showStarterHint, setShowStarterHint] = useState(true)
  const [isSolving, setIsSolving] = useState(false)
  const [solveClicked, setSolveClicked] = useState(false)
  const [wasSolvedByUser, setWasSolvedByUser] = useState(false)

  const gridSize = 3
  const tileSize = boardSize / gridSize
  const gap = 5 // Gap between tiles
  const padding = 10 // Padding around the board

  // Calculate the total puzzle area (tiles + gaps)
  const puzzleWidth = boardSize + gap * (gridSize - 1)
  const puzzleHeight = boardSize + gap * (gridSize - 1)

  // Calculate container size with padding
  const containerWidth = puzzleWidth + padding * 2
  const containerHeight = puzzleHeight + padding * 2

  // Get difficulty-based shuffle amount
  const getShuffleAmount = () => {
    switch (difficulty) {
      case "easy":
        return 5 * gridSize * gridSize
      case "medium":
        return 15 * gridSize * gridSize
      case "hard":
        return 25 * gridSize * gridSize
      default:
        return 15 * gridSize * gridSize
    }
  }

  // Initialize new board
  const initializeBoard = useCallback(() => {
    const newBoard = new Board(gridSize)
    newBoard.shuffleBoard(getShuffleAmount())
    setBoard(newBoard)
    setMoves(0)
    setIsCompleted(false)
    setIsVerified(false)
    setSolveClicked(false)
    setWasSolvedByUser(false)
    setTimeElapsed(0)
    setForceUpdate((prev) => prev + 1)
    setTimeout(() => setShowStarterHint(true), 100) // Show hint after board is ready
  }, [difficulty])

  // Handle tile click
  const handleTileClick = (puzzleValue: number) => {
    if (!board || isCompleted || puzzleValue === 0 || isSolving) return

    const index = board.gameState.findIndex((puzzle) => puzzle.value === puzzleValue)
    if (board.isMovePossible(index)) {
      board.makeMove(index)
      setMoves((prev) => prev + 1)
      setForceUpdate((prev) => prev + 1)
      setShowStarterHint(false) // Hide hint on first move
    }
  }

  // Handle solve button
  const handleSolve = async () => {
    if (!board || isCompleted || isSolving) return
    
    setSolveClicked(true)
    setIsSolving(true)
    setShowStarterHint(false)

    try {
      // Run solver in a timeout to prevent UI blocking
      const solution = await new Promise<number[]>((resolve) => {
        setTimeout(() => {
          const path = solvePuzzle(board)
          resolve(path)
        }, 100)
      })

      if (solution.length === 0) {
        alert("Could not find a solution!")
        setIsSolving(false)
        return
      }

      // Animate the solution
      for (let i = 0; i < solution.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (board.isMovePossible(solution[i])) {
          board.makeMove(solution[i])
          setMoves((prev) => prev + 1)
          setForceUpdate((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Solver error:", error)
      alert("Error solving puzzle!")
    }

    setIsSolving(false)
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCustomImage(e.target?.result as string)
        setTimeout(() => initializeBoard(), 100)
      }
      reader.readAsDataURL(file)
    }
    // Clear the input value to allow re-uploading the same file
    event.target.value = ""
  }

  // Handle continue button
  const handleContinue = () => {
    window.location.reload()
  }

  // Timer effect
  useEffect(() => {
    if (!isCompleted && board && !isSolving) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isCompleted, board, isSolving])

  // Check completion
  useEffect(() => {
    if (board && board.isSolved() && !isCompleted) {
      console.log(solveClicked)
      if (!solveClicked) {
        setWasSolvedByUser(true)
      }
      setIsCompleted(true)

      // Only set as solved by user if not currently auto-solving

      // Set verification regardless of how it was solved
      setTimeout(() => {
        setIsVerified(true)
        onVerificationComplete?.()
      }, 1000)
    }
  }, [board, forceUpdate, isCompleted, onVerificationComplete, isSolving])

  // Initialize on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  // Hide hint when first move is made
  useEffect(() => {
    if (moves > 0 && showStarterHint) {
      setShowStarterHint(false)
    }
  }, [moves, showStarterHint])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "hard":
        return "text-red-500"
      default:
        return "text-yellow-500"
    }
  }

  const currentImageUrl = customImage || imageUrl

  if (!board) return <div>Loading...</div>

  return (
    <div className="p-2.5 bg-gray-500/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
      <Card className="w-full md:max-w-md max-w-full max-md:h-full mx-auto dark bg-card text-card-foreground border-border">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {isVerified ? (
                <>
                {wasSolvedByUser ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {wasSolvedByUser ? "Verification Complete" : "Verification Failed"}
                </>
            ) : (
              "Sliding Puzzle CAPTCHA"
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isVerified
              ? wasSolvedByUser
                ? "You have been verified as human!"
                : "You are pretty dumb, even for a human... Try again!"
              : "Arrange the tiles to complete the image"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-4">
          {/* Stats */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(timeElapsed)}
              </Badge>
              <Badge variant="outline">Moves: {moves}</Badge>
            </div>
            <Badge variant="outline" className={getDifficultyColor()}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div>

          {/* Custom Image Upload */}
          {!isVerified && (
            <div className="flex items-center gap-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 border rounded-md transition-colors">
                  <Upload className="w-3 h-3" />
                  Custom Image
                </div>
              </label>
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {customImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomImage(null)
                    // Clear the file input
                    const fileInput = document.getElementById("image-upload") as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ""
                    }
                    // Initialize board after clearing custom image
                    setTimeout(() => initializeBoard(), 100)
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* Puzzle Board */}
          <div className="relative">
            <div
              className="relative bg-muted border-2 border-border mx-auto overflow-hidden rounded-xl flex items-center justify-center"
              style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
              }}
            >
              <div
                className="relative"
                style={{
                  width: `${puzzleWidth}px`,
                  height: `${puzzleHeight}px`,
                }}
              >
                {board.gameState.map((puzzle, index) => {
                  const { x, y, value } = puzzle

                  // Skip empty tile (value 0)
                  if (value === 0) return null

                  // Calculate image position based on tile's value (original position)
                  const imageX = getRowNumber(value - 1, gridSize)
                  const imageY = getColumnNumber(value - 1, gridSize)

                  const isPossibleMove = board.getPossibleMoves().includes(index)
                  const isFirstPossibleMove = showStarterHint && isPossibleMove && index === board.getPossibleMoves()[0]

                  return (
                      <div
                        key={`${value}-${forceUpdate}`}
                        className={`absolute border border-border transition-all duration-200 rounded-md ${
                          isPossibleMove && !isSolving
                            ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:z-10 hover:ring-2 hover:ring-yellow-400"
                            : "cursor-not-allowed opacity-75"
                        } ${isFirstPossibleMove ? "ring-2 ring-yellow-400 animate-pulse" : ""} ${
                          isSolving ? "pointer-events-none" : ""
                        }`}
                        style={{
                          width: `${tileSize}px`,
                          height: `${tileSize}px`,
                          top: `${x * (tileSize + gap)}px`,
                          left: `${y * (tileSize + gap)}px`,
                          backgroundImage: `url(${currentImageUrl})`,
                          backgroundPositionX: `-${imageY * tileSize}px`,
                          backgroundPositionY: `-${imageX * tileSize}px`,
                          backgroundSize: `${boardSize}px ${boardSize}px`,
                          zIndex: isPossibleMove ? 10 : 1,
                        }}
                        onClick={() => handleTileClick(value)}
                        data-value={value}
                      />
                  )
                })}
              </div>
            </div>

            {/* Completion Overlay */}
            {isCompleted && (
              <div className="z-10 absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="p-6 text-center max-w-xs mx-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Puzzle Solved!</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Completed in <span className="font-semibold text-green-600">{moves} moves</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Time: <span className="font-semibold text-blue-600">{formatTime(timeElapsed)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Solving Overlay */}
            {isSolving && (
              <div className="z-10 absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-xs">
                <div className="p-4 text-center">
                  <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Solving
                    <AnimatedDots />
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Starter Hint */}
          {showStarterHint && !isVerified && !isSolving && (
            <div className="text-center">
              <p className="text-sm text-blue-400 font-medium animate-pulse">👆 Click the highlighted tile to start!</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={initializeBoard}
              variant="outline"
              size="sm"
              className="flex-1 bg-slate-900 text-white hover:bg-yellow-200 hover:text-slate-900 transition-colors"
              disabled={isSolving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Puzzle
            </Button>

            {!isVerified && (
              <Button
                onClick={handleSolve}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isCompleted || isSolving}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {isSolving ? (
                  <>
                    Solving
                  </>
                ) : (
                  "Solve"
                )}
              </Button>
            )}

            {isVerified && wasSolvedByUser && (
              <Button className="flex-1" size="sm" onClick={handleContinue}>
                Continue
              </Button>
            )}
          </div>

          {/* Instructions */}
          {!isVerified && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Click tiles adjacent to the empty space to move them.</p>
              <p>Arrange all tiles to complete the verification.</p>
              {customImage && <p className="text-green-400">Using custom image</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
