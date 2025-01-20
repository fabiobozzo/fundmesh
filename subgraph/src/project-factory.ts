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
  let projectContract = ProjectContract.bind(event.params.projectAddress)
  
  // Required fields from event/contract
  project.projectAddress = event.params.projectAddress
  project.owner = event.params.owner
  project.recipient = projectContract.recipient()
  project.cid = event.params.cid
  project.minimumContribution = event.params.minimumContribution
  project.targetContribution = event.params.targetContribution
  project.deadline = event.params.deadline
  
  // Initialize numeric fields
  project.currentBalance = BigInt.fromI32(0)
  project.contributorsCount = BigInt.fromI32(0)
  project.approvalsCount = BigInt.fromI32(0)
  project.progressRatio = BigDecimal.fromString('0')
  project.trendingScore = BigDecimal.fromString('0')
  
  // Initialize boolean fields
  project.approved = false
  project.completed = false
  project.cancelled = false
  
  // Initialize timestamp fields
  project.createdAt = event.params.timestamp
  project.approvedAt = null
  project.completedAt = null
  project.cancelledAt = null
  
  // Initialize metadata fields with defaults
  project.name = 'Untitled Project'
  project.description = ''
  project.imageCid = ''
  
  // Try to fetch metadata from IPFS
  let ipfsData = ipfs.cat(event.params.cid + '/properties.json')
  if (ipfsData) {
    let metadata = json.fromBytes(ipfsData).toObject()
    
    let name = metadata.get('name')
    let description = metadata.get('description')
    let imageCid = metadata.get('imageCid')

    if (name && !name.isNull()) {
      project.name = name.toString()
    }
    if (description && !description.isNull()) {
      project.description = description.toString()
    }
    if (imageCid && !imageCid.isNull()) {
      project.imageCid = imageCid.toString()
    }
  }

  project.save()

  // Create activity
  let activity = new Activity(
    event.transaction.hash.toHexString() + "-create"
  )
  activity.project = project.id
  activity.type = "PROJECT_CREATED"
  activity.from = event.params.owner
  activity.timestamp = event.params.timestamp
  activity.save()

  // Create template instance
  ProjectTemplate.create(event.params.projectAddress)

  // Load initial milestones if any
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

  log.info('Project saved. ID: {}, Name: {}', [project.id, project.name])
}
