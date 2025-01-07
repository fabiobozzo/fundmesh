import { BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { ContributionMade } from '../generated/templates/Project/Project'
import { Project } from '../generated/schema'

export function handleContributionMade(event: ContributionMade): void {
  log.info('Processing contribution for project: {}, amount: {}, contributor: {}', [
    event.address.toHexString(),
    event.params.amount.toString(),
    event.params.contributor.toHexString()
  ])

  let project = Project.load(event.address.toHexString())
  if (!project) {
    log.warning('Project not found for address: {}', [event.address.toHexString()])
    return
  }

  project.currentBalance = event.params.currentBalance
  project.contributorsCount = event.params.contributorsCount
  
  // Calculate progress ratio
  if (project.targetContribution.gt(BigInt.fromI32(0))) {
    project.progressRatio = project.currentBalance.toBigDecimal()
      .div(project.targetContribution.toBigDecimal())
  }
  
  // Update trending score
  let now = event.block.timestamp
  let timeElapsed = now.minus(project.createdAt)
  if (timeElapsed.gt(BigInt.fromI32(0))) {
    project.trendingScore = project.currentBalance.toBigDecimal()
      .div(timeElapsed.toBigDecimal())
  }

  project.save()
  log.info('Updated project {} - balance: {}, contributors: {}', [
    project.id,
    project.currentBalance.toString(),
    project.contributorsCount.toString()
  ])
} 