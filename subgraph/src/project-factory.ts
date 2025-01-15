import { ProjectCreated } from '../generated/ProjectFactory/ProjectFactory'
import { Project as ProjectContract } from '../generated/templates/Project/Project'
import { Project, Milestone, Activity } from '../generated/schema'
import { json, ipfs, BigDecimal, BigInt, log, Bytes } from '@graphprotocol/graph-ts'
import { Project as ProjectTemplate } from '../generated/templates'

export function handleProjectCreated(event: ProjectCreated): void {
  log.info('New project created. Address: {}, Owner: {}, CID: {}', [
    event.params.projectAddress.toHexString(),
    event.params.owner.toHexString(),
    event.params.cid
  ])

  let project = new Project(event.params.projectAddress.toHexString())
  project.projectAddress = event.params.projectAddress
  project.owner = event.params.owner
  project.cid = event.params.cid
  project.createdAt = event.params.timestamp

  // Try to fetch from IPFS multiple times
  let attempts = 0;
  let maxAttempts = 3;
  let ipfsData: Bytes | null = null;

  while (attempts < maxAttempts && ipfsData === null) {
    ipfsData = ipfs.cat(event.params.cid + '/properties.json')
    if (!ipfsData) {
      log.warning('IPFS fetch attempt {} failed for {}', [attempts.toString(), event.params.cid])
      attempts++
    }
  }

  if (ipfsData) {
    log.info('IPFS data fetched successfully for {}', [event.params.cid])
    let metadata = json.fromBytes(ipfsData).toObject()
    
    let name = metadata.get('name')
    let description = metadata.get('description')
    let imageCid = metadata.get('imageCid')

    log.info('Parsed metadata - name: {}, description: {}, imageCid: {}', [
      name ? name.toString() : 'null',
      description ? description.toString() : 'null',
      imageCid ? imageCid.toString() : 'null'
    ])

    if (name && !name.isNull()) {
      project.name = name.toString()
    } else {
      project.name = 'Untitled Project'
      log.warning('Project name was null or empty for {}', [event.params.cid])
    }
    
    if (description && !description.isNull()) {
      project.description = description.toString()
    } else {
      project.description = ''
      log.warning('Project description was null for {}', [event.params.cid])
    }
    
    if (imageCid && !imageCid.isNull()) {
      project.imageCid = imageCid.toString()
      log.info('Setting imageCid to: {}', [imageCid.toString()])
    } else {
      project.imageCid = ''
      log.warning('Project imageCid was null for {}', [event.params.cid])
    }
  } else {
    log.error('All IPFS fetch attempts failed for {}', [event.params.cid])
    project.name = 'Untitled Project'
    project.description = ''
    project.imageCid = ''
  }

  // Initialize project metrics
  project.contributorsCount = BigInt.fromI32(0)
  project.currentBalance = BigInt.fromI32(0)
  project.minimumContribution = event.params.minimumContribution
  project.targetContribution = event.params.targetContribution
  project.deadline = event.params.deadline
  project.progressRatio = BigDecimal.fromString('0')
  project.trendingScore = BigDecimal.fromString('0')
  project.completed = false
  project.approved = false
  project.approvalsCount = BigInt.fromI32(0)

  // Create template instance to track this project's events
  ProjectTemplate.create(event.params.projectAddress)

  // Load initial milestones if any
  let projectContract = ProjectContract.bind(event.params.projectAddress)
  let milestonesCount = projectContract.try_getMilestonesCount()
  
  if (!milestonesCount.reverted) {
    for (let i = 0; i < milestonesCount.value.toI32(); i++) {
      let milestoneResult = projectContract.try_milestones(BigInt.fromI32(i))
      let statusResult = projectContract.try_milestoneStatuses(BigInt.fromI32(i))
      
      if (!milestoneResult.reverted && !statusResult.reverted) {
        let milestone = new Milestone(
          event.params.projectAddress.toHexString() + '-' + i.toString()
        )
        milestone.project = event.params.projectAddress.toHexString()
        milestone.index = BigInt.fromI32(i)
        
        // Access milestone struct fields
        let milestoneData = milestoneResult.value
        milestone.description = milestoneData.getDescription()
        milestone.threshold = milestoneData.getThreshold()
        milestone.recipient = milestoneData.getRecipient()

        // Access status struct fields
        let statusData = statusResult.value
        milestone.approved = statusData.getApproved()
        milestone.approvedAt = statusData.getApprovedAt()
        milestone.approvalsCount = statusData.getApprovalsCount()
        milestone.completed = statusData.getCompleted()
        milestone.completedAt = statusData.getCompletedAt()
        
        milestone.save()
      }
    }
  }

  // Create PROJECT_CREATED activity
  let activity = new Activity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  activity.project = project.id
  activity.type = "PROJECT_CREATED"
  activity.actor = event.params.owner
  activity.data = "{}"  // No additional data needed for creation
  activity.timestamp = event.params.timestamp
  activity.blockNumber = event.block.number
  activity.save()

  project.save()
  log.info('Project saved. ID: {}, Name: {}', [project.id, project.name])
}
